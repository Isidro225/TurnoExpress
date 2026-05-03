"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { areIntervalsOverlapping } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

export async function deleteAppointment(id: string) {
  const tenantId = await requireTenantId();
  await prisma.appointment.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  redirect("/admin/appointments");
}
