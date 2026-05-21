import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const DEFAULT_PAYMENT_HOLD_MINUTES = 15;
const MS_PER_MINUTE = 60_000;

export function getBookingPaymentHoldMinutes(): number {
  const raw = process.env.BOOKING_PAYMENT_HOLD_MINUTES;
  if (!raw) return DEFAULT_PAYMENT_HOLD_MINUTES;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_PAYMENT_HOLD_MINUTES;
}

export function getPendingPaymentHoldCutoff(now = new Date()): Date {
  return new Date(now.getTime() - getBookingPaymentHoldMinutes() * MS_PER_MINUTE);
}

export function isActivePendingPaymentHold(
  createdAt: Date,
  now = new Date()
): boolean {
  return createdAt >= getPendingPaymentHoldCutoff(now);
}

export function activePendingPaymentAppointmentWhere(
  now = new Date()
): Prisma.AppointmentWhereInput {
  return {
    status: "PENDING_PAYMENT",
    createdAt: { gte: getPendingPaymentHoldCutoff(now) },
  };
}

export function blockingAppointmentWhere(
  now = new Date()
): Prisma.AppointmentWhereInput {
  return {
    OR: [
      { status: "CONFIRMED" },
      activePendingPaymentAppointmentWhere(now),
    ],
  };
}

export function calendarAppointmentWhere(
  now = new Date()
): Prisma.AppointmentWhereInput {
  return {
    OR: [
      { status: { in: ["CONFIRMED", "COMPLETED", "NO_SHOW"] } },
      activePendingPaymentAppointmentWhere(now),
    ],
  };
}

export function visibleAppointmentWhere(
  now = new Date()
): Prisma.AppointmentWhereInput {
  return {
    OR: [
      { status: { not: "PENDING_PAYMENT" } },
      activePendingPaymentAppointmentWhere(now),
    ],
  };
}

export function countedForPlanAppointmentWhere(
  now = new Date()
): Prisma.AppointmentWhereInput {
  return {
    OR: [
      { status: { in: ["CONFIRMED", "COMPLETED", "NO_SHOW"] } },
      activePendingPaymentAppointmentWhere(now),
    ],
  };
}

type AppointmentClient = Prisma.TransactionClient | typeof prisma;

export async function canConfirmAppointmentSlot(
  appointment: {
    id: string;
    tenantId: string;
    staffId: string;
    startsAt: Date;
    endsAt: Date;
  },
  client: AppointmentClient = prisma
): Promise<boolean> {
  const conflict = await client.appointment.findFirst({
    where: {
      tenantId: appointment.tenantId,
      staffId: appointment.staffId,
      id: { not: appointment.id },
      status: "CONFIRMED",
      startsAt: { lt: appointment.endsAt },
      endsAt: { gt: appointment.startsAt },
    },
    select: { id: true },
  });

  return !conflict;
}
