import Link from "next/link";
import type { CSSProperties } from "react";
import type { Prisma } from "@prisma/client";
import {
  addDays,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "../_components/PageHeader";
import { NowLine } from "../_components/NowLine";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  ClockIcon,
} from "../_components/AdminIcons";

const START_HOUR = 7;
const END_HOUR = 23;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 34;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const TOTAL_SLOTS = TOTAL_MINUTES / SLOT_MINUTES;
const DAY_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;
const HOUR_HEIGHT = SLOT_HEIGHT * 2;

const TIME_SLOTS = Array.from({ length: TOTAL_SLOTS + 1 }, (_, index) => {
  const minutes = START_HOUR * 60 + index * SLOT_MINUTES;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return {
    index,
    isHour: minute === 0,
    label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
});

const STATUS_STYLES: Record<string, { box: string; bar: string }> = {
  CONFIRMED: {
    box: "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-100",
    bar: "border-emerald-500",
  },
  PENDING_PAYMENT: {
    box: "bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100",
    bar: "border-amber-500",
  },
  COMPLETED: {
    box: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300",
    bar: "border-zinc-400",
  },
  NO_SHOW: {
    box: "bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-100",
    bar: "border-red-500",
  },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  NO_SHOW: "No vino",
};

type AppointmentWithDetails = Prisma.AppointmentGetPayload<{
  include: { service: true; staff: true; payments: true };
}>;

type PositionedAppointment = {
  appointment: AppointmentWithDetails;
  lane: number;
  laneCount: number;
};

function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function parseDateParam(value: string | undefined): Date {
  if (!value) return new Date();
  try {
    const d = parseISO(value);
    if (Number.isNaN(d.getTime())) return new Date();
    return d;
  } catch {
    return new Date();
  }
}

function minutesFromStart(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() - START_HOUR * 60;
}

function durationMinutes(startsAt: Date, endsAt: Date): number {
  return Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000));
}

function buildAppointmentLayout(
  appointments: AppointmentWithDetails[]
): PositionedAppointment[] {
  const sorted = [...appointments].sort(
    (a, b) =>
      a.startsAt.getTime() - b.startsAt.getTime() ||
      a.endsAt.getTime() - b.endsAt.getTime()
  );
  const positioned: PositionedAppointment[] = [];
  let group: AppointmentWithDetails[] = [];
  let groupEnd = 0;

  function flushGroup() {
    if (group.length === 0) return;

    const laneEnds: number[] = [];
    const placements: Array<{
      appointment: AppointmentWithDetails;
      lane: number;
    }> = [];

    for (const appointment of group) {
      const start = appointment.startsAt.getTime();
      let lane = laneEnds.findIndex((end) => end <= start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[lane] = appointment.endsAt.getTime();
      placements.push({ appointment, lane });
    }

    const laneCount = Math.max(1, laneEnds.length);
    positioned.push(
      ...placements.map((placement) => ({
        ...placement,
        laneCount,
      }))
    );
  }

  for (const appointment of sorted) {
    const start = appointment.startsAt.getTime();
    const end = appointment.endsAt.getTime();

    if (group.length === 0) {
      group = [appointment];
      groupEnd = end;
      continue;
    }

    if (start < groupEnd) {
      group.push(appointment);
      groupEnd = Math.max(groupEnd, end);
      continue;
    }

    flushGroup();
    group = [appointment];
    groupEnd = end;
  }

  flushGroup();
  return positioned;
}

function getAppointmentMetrics(item: PositionedAppointment): {
  style: CSSProperties;
  height: number;
} {
  const startMin = Math.max(
    0,
    Math.min(TOTAL_MINUTES, minutesFromStart(item.appointment.startsAt))
  );
  const endMin = Math.max(
    startMin + 15,
    Math.min(TOTAL_MINUTES, minutesFromStart(item.appointment.endsAt))
  );
  const top = (startMin / SLOT_MINUTES) * SLOT_HEIGHT;
  const height = Math.max(44, ((endMin - startMin) / SLOT_MINUTES) * SLOT_HEIGHT - 4);
  const laneWidth = 100 / item.laneCount;

  return {
    height,
    style: {
      top,
      height,
      left: `calc(${item.lane * laneWidth}% + 4px)`,
      width: `calc(${laneWidth}% - 7px)`,
    },
  };
}

function serviceLabel(appointment: AppointmentWithDetails): string {
  return appointment.designName
    ? `${appointment.service.name} + ${appointment.designName}`
    : appointment.service.name;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; staff?: string }>;
}) {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const sp = await searchParams;

  const cursor = parseDateParam(sp.date);
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const staff = await prisma.staff.findMany({
    where: { tenantId, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      startsAt: { gte: weekStart, lte: weekEnd },
      status: { in: ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "NO_SHOW"] },
      ...(sp.staff ? { staffId: sp.staff } : {}),
    },
    orderBy: { startsAt: "asc" },
    include: { service: true, staff: true, payments: true },
  });

  const buildHref = (overrides: { date?: Date; staff?: string | null }) => {
    const params = new URLSearchParams();
    const dateValue = overrides.date ? toIsoDate(overrides.date) : sp.date;
    if (dateValue) params.set("date", dateValue);
    const staffValue =
      overrides.staff !== undefined ? overrides.staff ?? "" : sp.staff;
    if (staffValue) params.set("staff", staffValue);
    const qs = params.toString();
    return qs ? `/admin/calendar?${qs}` : "/admin/calendar";
  };

  const today = new Date();
  const dayGroups = days.map((day) => ({
    day,
    appointments: appointments.filter((a) => isSameDay(a.startsAt, day)),
  }));
  const selectedStaff = sp.staff ? staff.find((s) => s.id === sp.staff) : null;
  const selectedDay =
    dayGroups.find(({ day }) => isSameDay(day, cursor)) ?? dayGroups[0];

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Calendario"
        description={`Semana del ${format(weekStart, "d MMM", { locale: es })} al ${format(weekEnd, "d MMM yyyy", { locale: es })}${selectedStaff ? ` · ${selectedStaff.name}` : ""}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="inline-flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
          <Link
            href={buildHref({ date: addDays(weekStart, -7) })}
            className="flex items-center px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Semana anterior"
          >
            <ChevronLeftIcon />
          </Link>
          <Link
            href={buildHref({ date: new Date() })}
            className="border-x border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Hoy
          </Link>
          <Link
            href={buildHref({ date: addDays(weekStart, 7) })}
            className="flex items-center px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Semana siguiente"
          >
            <ChevronRightIcon />
          </Link>
        </div>

        <form className="flex items-center gap-2">
          <select
            name="staff"
            defaultValue={sp.staff ?? ""}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Todos los profesionales</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {sp.date && <input type="hidden" name="date" value={sp.date} />}
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Filtrar
          </button>
        </form>
      </div>

      <div className="md:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {format(selectedDay.day, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <p className="text-xs text-zinc-500">
              {selectedDay.appointments.length}{" "}
              {selectedDay.appointments.length === 1 ? "turno" : "turnos"}
            </p>
          </div>
          <div className="inline-flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <Link
              href={buildHref({ date: addDays(cursor, -1) })}
              className="px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Día anterior"
            >
              <ChevronLeftIcon />
            </Link>
            <Link
              href={buildHref({ date: addDays(cursor, 1) })}
              className="border-l border-zinc-200 px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              aria-label="Día siguiente"
            >
              <ChevronRightIcon />
            </Link>
          </div>
        </div>

        <CalendarGrid
          days={[selectedDay]}
          today={today}
          minWidth="22rem"
          showHeader={false}
        />
      </div>

      <div className="hidden md:block">
        <CalendarGrid days={dayGroups} today={today} minWidth="1120px" showHeader />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <Legend dot="bg-emerald-500" label="Confirmado" />
        <Legend dot="bg-amber-500" label="Pendiente de pago" />
        <Legend dot="bg-zinc-400" label="Completado" />
        <Legend dot="bg-red-500" label="No se presentó" />
        <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
          hora actual
        </span>
      </div>
    </div>
  );
}

function CalendarGrid({
  days,
  today,
  minWidth,
  showHeader,
}: {
  days: Array<{ day: Date; appointments: AppointmentWithDetails[] }>;
  today: Date;
  minWidth: string;
  showHeader: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className={`grid ${showHeader ? "grid-cols-[4.75rem_repeat(7,minmax(8.5rem,1fr))]" : "grid-cols-[4.75rem_minmax(0,1fr)]"}`}
        style={{ minWidth }}
      >
        {showHeader && (
          <>
            <div className="border-b border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950" />
            {days.map(({ day, appointments }) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={`head-${day.toISOString()}`}
                  className={`border-b border-r border-zinc-200 px-2 py-2 text-center text-sm last:border-r-0 dark:border-zinc-800 ${
                    isToday ? "bg-sky-50/60 dark:bg-sky-950/20" : "bg-zinc-50 dark:bg-zinc-950"
                  }`}
                >
                  <div className="text-[10px] font-semibold uppercase text-zinc-500">
                    {format(day, "EEE", { locale: es })}
                  </div>
                  <div className="mt-0.5 flex items-center justify-center gap-2">
                    <span className="truncate font-semibold">
                      {format(day, "d MMM", { locale: es })}
                    </span>
                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                        isToday
                          ? "bg-sky-500 text-white"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {appointments.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        <TimeAxis />
        {days.map(({ day, appointments }) => (
          <DayColumn
            key={`col-${day.toISOString()}`}
            day={day}
            appointments={appointments}
            today={today}
          />
        ))}
      </div>
    </div>
  );
}

function TimeAxis() {
  return (
    <div
      className="relative border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      style={{ height: DAY_HEIGHT }}
    >
      {TIME_SLOTS.map((slot) => (
        <div
          key={slot.label}
          className={`absolute left-0 right-0 -translate-y-1/2 pr-2 text-right ${
            slot.isHour ? "text-[10px] font-medium text-zinc-500" : "text-[9px] text-zinc-400"
          }`}
          style={{ top: slot.index * SLOT_HEIGHT }}
        >
          {slot.label}
        </div>
      ))}
    </div>
  );
}

function DayColumn({
  day,
  appointments,
  today,
}: {
  day: Date;
  appointments: AppointmentWithDetails[];
  today: Date;
}) {
  const isToday = isSameDay(day, today);
  const positioned = buildAppointmentLayout(appointments);

  return (
    <div
      className={`relative border-r border-zinc-200 last:border-r-0 dark:border-zinc-800 ${
        isToday ? "bg-sky-50/20 dark:bg-sky-950/10" : ""
      }`}
      style={{ height: DAY_HEIGHT }}
    >
      {TIME_SLOTS.map((slot) => (
        <div
          key={`${day.toISOString()}-${slot.label}`}
          className={`absolute left-0 right-0 border-t ${
            slot.isHour
              ? "border-zinc-200 dark:border-zinc-700"
              : "border-dashed border-zinc-100 dark:border-zinc-800/80"
          }`}
          style={{ top: slot.index * SLOT_HEIGHT }}
        />
      ))}

      {isToday && (
        <NowLine
          startHour={START_HOUR}
          endHour={END_HOUR}
          hourHeight={HOUR_HEIGHT}
        />
      )}

      {positioned.map((item) => {
        const { style, height } = getAppointmentMetrics(item);
        return (
          <AppointmentBlock
            key={item.appointment.id}
            item={item}
            style={style}
            showDetails={height >= 58}
          />
        );
      })}
    </div>
  );
}

function AppointmentBlock({
  item,
  style,
  showDetails,
}: {
  item: PositionedAppointment;
  style: CSSProperties;
  showDetails: boolean;
}) {
  const appointment = item.appointment;
  const cfg = STATUS_STYLES[appointment.status] ?? {
    box: "bg-zinc-50 text-zinc-700",
    bar: "border-zinc-400",
  };
  const paid = appointment.payments.some((p) => p.status === "APPROVED");
  const statusLabel = STATUS_LABEL[appointment.status] ?? appointment.status;
  const duration = durationMinutes(appointment.startsAt, appointment.endsAt);
  const label = serviceLabel(appointment);

  return (
    <Link
      href={`/admin/appointments/${appointment.id}`}
      title={`${format(appointment.startsAt, "HH:mm")} - ${format(appointment.endsAt, "HH:mm")} | ${appointment.customerName} | ${label} | ${appointment.staff.name} | ${statusLabel}`}
      className={`absolute z-10 overflow-hidden rounded-md border-l-4 px-2 py-1 text-[11px] leading-tight shadow-sm ring-1 ring-black/5 transition hover:z-20 hover:shadow-md ${cfg.box} ${cfg.bar}`}
      style={style}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate font-semibold">
          {format(appointment.startsAt, "HH:mm")} - {format(appointment.endsAt, "HH:mm")}
        </span>
        {paid ? (
          <CreditCardIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : appointment.status === "PENDING_PAYMENT" ? (
          <ClockIcon className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        ) : null}
      </div>
      <div className="mt-0.5 truncate font-semibold">{appointment.customerName}</div>
      {showDetails && (
        <>
          <div className="truncate text-[10px] opacity-80">{label}</div>
          <div className="truncate text-[10px] opacity-70">
            {appointment.staff.name} · {duration} min
          </div>
        </>
      )}
    </Link>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
