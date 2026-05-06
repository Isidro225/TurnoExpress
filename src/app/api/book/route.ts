import { NextResponse } from "next/server";
import { z } from "zod";
import { areIntervalsOverlapping } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createDepositPreference } from "@/lib/mercadopago";
import { isBookingPaymentBypassEnabled } from "@/lib/booking-payment";
import { assertCanCreateAppointment, PlanLimitError } from "@/lib/plan-limits";

const bookSchema = z.object({
  tenantSlug: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  startsAt: z.string().datetime(),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(40).optional(),
  notes: z.string().max(500).optional(),
  // Campos específicos del flujo de uñas. Otros tipos de negocio los mandan vacíos/ausentes.
  priorServiceId: z.string().min(1).nullable().optional(),
  priorAge: z.enum(["D15_21", "D21_25", "MONTH_PLUS"]).nullable().optional(),
  procedureMode: z.enum(["fresh", "service", "retiro"]).nullable().optional(),
  designId: z.string().min(1).nullable().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: parsed.data.tenantSlug },
  });
  if (!tenant?.active) {
    return NextResponse.json({ error: "Negocio no disponible" }, { status: 404 });
  }

  const paymentBypassEnabled = isBookingPaymentBypassEnabled();
  let mpAccessToken = "";
  if (!paymentBypassEnabled) {
    if (!tenant.mpAccessToken) {
      return NextResponse.json(
        { error: "Este negocio no tiene Mercado Pago configurado" },
        { status: 400 }
      );
    }
    mpAccessToken = tenant.mpAccessToken;
  }

  const service = await prisma.service.findFirst({
    where: { id: parsed.data.serviceId, tenantId: tenant.id, active: true },
  });
  if (!service) {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 404 });
  }

  const staffLink = await prisma.staffService.findUnique({
    where: {
      staffId_serviceId: { staffId: parsed.data.staffId, serviceId: service.id },
    },
    include: { staff: true },
  });
  if (!staffLink || !staffLink.staff.active || staffLink.staff.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Profesional no disponible" }, { status: 404 });
  }

  // Calculá los minutos extra del flujo de uñas (retiro + diseño). Se recomputa en el server
  // a partir del modo y los minutos guardados en BD; nunca se confía en lo que llegó del cliente.
  const isNails = tenant.businessType === "nails";
  let extraMinutes = 0;
  let priorServiceName: string | null = null;
  let priorAge: string | null = null;
  let procedureMode: string | null = isNails ? "fresh" : null;
  let withDesign = false;

  if (isNails) {
    const requestedMode = parsed.data.procedureMode ?? "fresh";
    const requestedPriorId = parsed.data.priorServiceId ?? null;
    withDesign = !!parsed.data.withDesign;
    procedureMode = requestedMode;
    priorAge = parsed.data.priorAge ?? null;

    if (requestedMode !== "fresh") {
      if (!requestedPriorId) {
        return NextResponse.json(
          { error: "Falta indicar qué tenés hecho." },
          { status: 400 }
        );
      }
      const prior = await prisma.priorService.findFirst({
        where: { id: requestedPriorId, tenantId: tenant.id, active: true },
      });
      if (!prior) {
        return NextResponse.json(
          { error: "El servicio previo seleccionado no está disponible." },
          { status: 400 }
        );
      }
      priorServiceName = prior.name;
      if (requestedMode === "retiro") extraMinutes += prior.removalMin;
    }

    if (withDesign && service.designMin) {
      extraMinutes += service.designMin;
    }
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(
    startsAt.getTime() + (service.durationMin + extraMinutes) * 60_000
  );

  // Re-verificación de disponibilidad para evitar race conditions entre dos reservas paralelas.
  const conflicts = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      staffId: staffLink.staff.id,
      status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true, startsAt: true, endsAt: true },
  });
  const stillBlocked = conflicts.some((c) =>
    areIntervalsOverlapping(
      { start: c.startsAt, end: c.endsAt },
      { start: startsAt, end: endsAt }
    )
  );
  if (stillBlocked) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible" },
      { status: 409 }
    );
  }

  try {
    await assertCanCreateAppointment(tenant.id);
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { error: "Este negocio no está aceptando más reservas este mes." },
        { status: 403 }
      );
    }
    throw err;
  }

  const depositPct = service.depositPct ?? tenant.depositPct;
  const requiredDepositCents = Math.max(
    100,
    Math.round((service.priceCents * depositPct) / 100)
  );
  const depositCents = paymentBypassEnabled ? 0 : requiredDepositCents;

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;

  const appointment = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      serviceId: service.id,
      staffId: staffLink.staff.id,
      startsAt,
      endsAt,
      status: paymentBypassEnabled ? "CONFIRMED" : "PENDING_PAYMENT",
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      notes: parsed.data.notes,
      priceCents: service.priceCents,
      depositCents,
      priorServiceName,
      priorAge,
      procedureMode,
      withDesign,
      extraMinutes,
    },
  });

  if (paymentBypassEnabled) {
    return NextResponse.json({
      appointmentId: appointment.id,
      redirectUrl: `${baseUrl}/${tenant.slug}/book/success?id=${appointment.id}`,
      paymentBypassed: true,
    });
  }

  let initPoint: string;
  let preferenceId: string;
  try {
    const pref = await createDepositPreference({
      accessToken: mpAccessToken,
      appointmentId: appointment.id,
      tenantSlug: tenant.slug,
      serviceName: service.name,
      amountCents: depositCents,
      payerEmail: parsed.data.customerEmail,
      baseUrl,
    });
    initPoint = pref.init_point ?? pref.sandbox_init_point ?? "";
    preferenceId = pref.id ?? "";
    if (!initPoint) throw new Error("MP no devolvió init_point");
  } catch (err) {
    console.error("[book] createDepositPreference falló:", err);
    await prisma.appointment.delete({ where: { id: appointment.id } });
    return NextResponse.json(
      {
        error:
          "No pudimos generar el cobro de la seña. Probá de nuevo en unos minutos.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }

  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      appointmentId: appointment.id,
      preferenceId,
      amountCents: depositCents,
      status: "PENDING",
    },
  });

  return NextResponse.json({ appointmentId: appointment.id, initPoint });
}
