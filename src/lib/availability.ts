import {
  addMinutes,
  areIntervalsOverlapping,
  getDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  startOfDay,
  endOfDay,
  isAfter,
} from "date-fns";
import { prisma } from "./prisma";

export type Slot = {
  startsAt: Date;
  endsAt: Date;
};

export type StaffSlots = {
  staffId: string;
  staffName: string;
  slots: Slot[];
};

const SLOT_GRANULARITY_MIN = 15;

// TODO(timezone): asumimos que `date` y los horarios trabajan en la TZ del servidor.
// Para producción multi-zona, recibir tenant.timezone y convertir con date-fns-tz.
export async function getAvailability(args: {
  tenantId: string;
  serviceId: string;
  date: Date;
  staffId?: string;
}): Promise<StaffSlots[]> {
  const service = await prisma.service.findFirst({
    where: { id: args.serviceId, tenantId: args.tenantId, active: true },
    include: {
      staff: {
        where: args.staffId ? { staffId: args.staffId } : undefined,
        include: {
          staff: {
            include: {
              schedules: true,
              timeOff: {
                where: {
                  endsAt: { gte: startOfDay(args.date) },
                  startsAt: { lte: endOfDay(args.date) },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!service) return [];
  const weekday = getDay(args.date);

  const existingAppts = await prisma.appointment.findMany({
    where: {
      tenantId: args.tenantId,
      status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      startsAt: { gte: startOfDay(args.date), lte: endOfDay(args.date) },
      ...(args.staffId ? { staffId: args.staffId } : {}),
    },
    select: { staffId: true, startsAt: true, endsAt: true },
  });

  const now = new Date();
  const result: StaffSlots[] = [];

  for (const ss of service.staff) {
    const staff = ss.staff;
    if (!staff.active) continue;

    const blocks = staff.schedules.filter((s) => s.weekday === weekday);
    if (blocks.length === 0) continue;

    const slots: Slot[] = [];
    for (const block of blocks) {
      // Cada bloque (startMin..endMin) lo recorremos en pasos de SLOT_GRANULARITY_MIN
      // y aceptamos un slot si entra entero antes de endMin y no choca con nada.
      for (let m = block.startMin; m + service.durationMin <= block.endMin; m += SLOT_GRANULARITY_MIN) {
        const startsAt = setMilliseconds(
          setSeconds(setMinutes(setHours(args.date, Math.floor(m / 60)), m % 60), 0),
          0
        );
        const endsAt = addMinutes(startsAt, service.durationMin);

        if (!isAfter(startsAt, now)) continue;

        const conflictsAppt = existingAppts.some(
          (a) =>
            a.staffId === staff.id &&
            areIntervalsOverlapping(
              { start: a.startsAt, end: a.endsAt },
              { start: startsAt, end: endsAt }
            )
        );
        if (conflictsAppt) continue;

        const conflictsTimeOff = staff.timeOff.some((t) =>
          areIntervalsOverlapping(
            { start: t.startsAt, end: t.endsAt },
            { start: startsAt, end: endsAt }
          )
        );
        if (conflictsTimeOff) continue;

        slots.push({ startsAt, endsAt });
      }
    }

    if (slots.length > 0) {
      result.push({ staffId: staff.id, staffName: staff.name, slots });
    }
  }

  return result;
}
