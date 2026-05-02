import { NextResponse } from "next/server";
import { z } from "zod";
import { areIntervalsOverlapping } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createDepositPreference } from "@/lib/mercadopago";

const bookSchema = z.object({
  tenantSlug: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  startsAt: z.string().datetime(),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(40).optional(),
  notes: z.string().max(500).optional(),
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
  if (!tenant.mpAccessToken) {
    return NextResponse.json(
      { error: "Este negocio no tiene Mercado Pago configurado" },
      { status: 400 }
    );
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

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);

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

  const depositPct = service.depositPct ?? tenant.depositPct;
  const depositCents = Math.max(100, Math.round((service.priceCents * depositPct) / 100));

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;

  const appointment = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      serviceId: service.id,
      staffId: staffLink.staff.id,
      startsAt,
      endsAt,
      status: "PENDING_PAYMENT",
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      notes: parsed.data.notes,
      priceCents: service.priceCents,
      depositCents,
    },
  });

  let initPoint: string;
  let preferenceId: string;
  try {
    const pref = await createDepositPreference({
      accessToken: tenant.mpAccessToken,
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
