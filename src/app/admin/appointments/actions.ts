"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { areIntervalsOverlapping } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertCanCreateAppointment } from "@/lib/plan-limits";
import { findOrCreateCustomer } from "@/lib/customers";

const ALLOWED_STATUSES = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"] as const;

async function requireTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");
  return session.user.tenantId;
}

export async function setAppointmentStatus(
  id: string,
  status: (typeof ALLOWED_STATUSES)[number]
) {
  const tenantId = await requireTenantId();
  if (!ALLOWED_STATUSES.includes(status)) throw new Error("Estado inválido");
  await prisma.appointment.updateMany({
    where: { id, tenantId },
    data: { status },
  });
  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
}

export async function cancelAppointment(id: string) {
  await setAppointmentStatus(id, "CANCELLED");
}

const rescheduleSchema = z.object({
  startsAt: z.string().datetime(),
  staffId: z.string().min(1),
});

export async function rescheduleAppointment(id: string, formData: FormData) {
  const tenantId = await requireTenantId();

  const parsed = rescheduleSchema.safeParse({
    startsAt: formData.get("startsAt"),
    staffId: formData.get("staffId"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const appointment = await prisma.appointment.findFirst({
    where: { id, tenantId },
    include: { service: true },
  });
  if (!appointment) throw new Error("Turno no encontrado");

  if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
    throw new Error("No se puede reagendar un turno cancelado o completado");
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(startsAt.getTime() + appointment.service.durationMin * 60_000);

  // Verificar que el staff atienda este servicio
  const link = await prisma.staffService.findUnique({
    where: {
      staffId_serviceId: {
        staffId: parsed.data.staffId,
        serviceId: appointment.serviceId,
      },
    },
    include: { staff: true },
  });
  if (!link || !link.staff.active || link.staff.tenantId !== tenantId) {
    throw new Error("Profesional no disponible para este servicio");
  }

  // Verificar conflictos con otros turnos del mismo profesional
  const conflicts = await prisma.appointment.findMany({
    where: {
      tenantId,
      staffId: parsed.data.staffId,
      id: { not: id },
      status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true, startsAt: true, endsAt: true },
  });
  const overlapping = conflicts.some((c) =>
    areIntervalsOverlapping(
      { start: c.startsAt, end: c.endsAt },
      { start: startsAt, end: endsAt }
    )
  );
  if (overlapping) throw new Error("Ese horario choca con otro turno");

  await prisma.appointment.update({
    where: { id },
    data: {
      startsAt,
      endsAt,
      staffId: parsed.data.staffId,
    },
  });

  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  redirect(`/admin/appointments/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Creación manual desde el admin (sin pasar por Mercado Pago)
// ─────────────────────────────────────────────────────────────────────────────

const createSchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  startsAt: z.string().datetime(),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1).max(40),
  notes: z.string().max(500).optional().nullable(),
  // Específicos del flujo de uñas. Otros tipos los mandan vacíos/null.
  secondaryServiceId: z.string().min(1).optional().nullable(),
  designId: z.string().min(1).optional().nullable(),
  procedureMode: z.enum(["fresh", "service", "retiro"]).optional().nullable(),
  priorServiceId: z.string().min(1).optional().nullable(),
  priorAge: z.enum(["D15_21", "D21_25", "MONTH_PLUS"]).optional().nullable(),
});

export async function createAppointment(formData: FormData) {
  const tenantId = await requireTenantId();

  const parsed = createSchema.safeParse({
    serviceId: formData.get("serviceId"),
    staffId: formData.get("staffId"),
    startsAt: formData.get("startsAt"),
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    notes: formData.get("notes") || null,
    secondaryServiceId: formData.get("secondaryServiceId") || null,
    designId: formData.get("designId") || null,
    procedureMode: formData.get("procedureMode") || null,
    priorServiceId: formData.get("priorServiceId") || null,
    priorAge: formData.get("priorAge") || null,
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  // Bloqueo por plan antes de hacer cualquier escritura
  await assertCanCreateAppointment(tenantId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { businessType: true },
  });
  const isNails = tenant?.businessType === "nails";

  const service = await prisma.service.findFirst({
    where: { id: parsed.data.serviceId, tenantId, active: true },
  });
  if (!service) throw new Error("Servicio no disponible");

  const link = await prisma.staffService.findUnique({
    where: {
      staffId_serviceId: { staffId: parsed.data.staffId, serviceId: service.id },
    },
    include: { staff: true },
  });
  if (!link || !link.staff.active || link.staff.tenantId !== tenantId) {
    throw new Error("Ese profesional no atiende este servicio");
  }

  // Mismo cálculo que /api/book: extraMinutes y snapshots se computan en el server
  // a partir de los datos en BD; nunca se confía en lo que llegó del form.
  let extraMinutes = 0;
  let priorServiceName: string | null = null;
  let priorAge: string | null = null;
  let procedureMode: string | null = isNails ? "fresh" : null;
  let designId: string | null = null;
  let designName: string | null = null;
  let designPriceCents: number | null = null;
  let secondaryServiceId: string | null = null;
  let secondaryServiceName: string | null = null;
  let secondaryServicePriceCents: number | null = null;
  let secondaryServiceDurationMin: number | null = null;

  if (isNails) {
    procedureMode = parsed.data.procedureMode ?? "fresh";
    priorAge = parsed.data.priorAge ?? null;

    if (procedureMode !== "fresh") {
      if (!parsed.data.priorServiceId) {
        throw new Error("Falta indicar el servicio previo");
      }
      const prior = await prisma.priorService.findFirst({
        where: { id: parsed.data.priorServiceId, tenantId, active: true },
      });
      if (!prior) throw new Error("Servicio previo no disponible");
      priorServiceName = prior.name;
      if (procedureMode === "retiro") extraMinutes += prior.removalMin;
    }

    if (parsed.data.designId) {
      const design = await prisma.design.findFirst({
        where: { id: parsed.data.designId, tenantId, active: true },
      });
      if (!design) throw new Error("Diseño no disponible");
      designId = design.id;
      designName = design.name;
      designPriceCents = design.priceCents;
      extraMinutes += design.durationMin;
    }

    if (parsed.data.secondaryServiceId) {
      if (parsed.data.secondaryServiceId === service.id) {
        throw new Error("El servicio secundario debe ser distinto al principal");
      }
      const secondary = await prisma.service.findFirst({
        where: { id: parsed.data.secondaryServiceId, tenantId, active: true },
      });
      if (!secondary) throw new Error("Servicio secundario no disponible");
      const validCombo =
        (service.category === "hands" && secondary.category === "feet") ||
        (service.category === "feet" && secondary.category === "hands");
      if (!validCombo) {
        throw new Error("Sólo se puede combinar manos con pies");
      }
      const secondaryStaffLink = await prisma.staffService.findUnique({
        where: {
          staffId_serviceId: { staffId: link.staff.id, serviceId: secondary.id },
        },
      });
      if (!secondaryStaffLink) {
        throw new Error("Ese profesional no atiende la combinación elegida");
      }
      secondaryServiceId = secondary.id;
      secondaryServiceName = secondary.name;
      secondaryServicePriceCents = secondary.priceCents;
      secondaryServiceDurationMin = secondary.durationMin;
      extraMinutes += secondary.durationMin;
    }
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(
    startsAt.getTime() + (service.durationMin + extraMinutes) * 60_000
  );

  const conflicts = await prisma.appointment.findMany({
    where: {
      tenantId,
      staffId: parsed.data.staffId,
      status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true, startsAt: true, endsAt: true },
  });
  const overlapping = conflicts.some((c) =>
    areIntervalsOverlapping(
      { start: c.startsAt, end: c.endsAt },
      { start: startsAt, end: endsAt }
    )
  );
  if (overlapping) throw new Error("Ese horario choca con otro turno");

  const totalPriceCents =
    service.priceCents + (designPriceCents ?? 0) + (secondaryServicePriceCents ?? 0);

  const customer = await findOrCreateCustomer({
    tenantId,
    rawPhone: parsed.data.customerPhone,
    name: parsed.data.customerName,
    email: parsed.data.customerEmail,
  });

  const created = await prisma.appointment.create({
    data: {
      tenantId,
      customerId: customer?.id ?? null,
      serviceId: service.id,
      staffId: parsed.data.staffId,
      startsAt,
      endsAt,
      status: "CONFIRMED",
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      notes: parsed.data.notes ?? null,
      priceCents: totalPriceCents,
      depositCents: 0,
      priorServiceName,
      priorAge,
      procedureMode,
      designId,
      designName,
      designPriceCents,
      secondaryServiceId,
      secondaryServiceName,
      secondaryServicePriceCents,
      secondaryServiceDurationMin,
      extraMinutes,
    },
  });

  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  redirect(`/admin/appointments/${created.id}`);
}

export async function deleteAppointment(id: string) {
  const tenantId = await requireTenantId();
  await prisma.appointment.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  redirect("/admin/appointments");
}
