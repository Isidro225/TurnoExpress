import Link from "next/link";
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
import { EmptyState } from "../_components/EmptyState";
import { NowLine } from "../_components/NowLine";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  ClockIcon,
} from "../_components/AdminIcons";

const HOUR_HEIGHT = 64;
const START_HOUR = 7;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const DAY_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

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

  const dayAppts = appointments.filter((a) => isSameDay(a.startsAt, cursor));
  const today = new Date();
  const cursorIsToday = isSameDay(cursor, today);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendario"
        description={`Semana del ${format(weekStart, "d MMM", { locale: es })} al ${format(weekEnd, "d MMM yyyy", { locale: es })}`}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Pill nav */}
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

      {/* Vista mobile: día */}
      <div className="md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">
            {format(cursor, "EEEE d 'de' MMMM", { locale: es })}
          </p>
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
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {dayAppts.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon className="h-6 w-6" />}
              title="No hay turnos para este día"
              description="Aprovechá para cargar bloqueos o avisar disponibilidad en redes."
            />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {dayAppts.map((a) => {
                const cfg = STATUS_STYLES[a.status] ?? {
                  box: "bg-zinc-50 text-zinc-700",
                  bar: "border-zinc-400",
                };
                const paid = a.payments.some((p) => p.status === "APPROVED");
                return (
                  <li key={a.id}>
                    <Link
                      href={`/admin/appointments/${a.id}`}
                      className="flex items-stretch gap-3 p-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
                      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-md bg-zinc-50 text-center dark:bg-zinc-800">
                        <span className="text-base font-bold">
                          {format(a.startsAt, "HH:mm")}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {a.service.durationMin} min
                        </span>
                      </div>
                      <div className={`flex-1 rounded-md border-l-4 px-3 py-2 ${cfg.bar} ${cfg.box}`}>
                        <p className="font-medium">{a.customerName}</p>
                        <p className="text-sm">
                          {a.service.name} · {a.staff.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-wider opacity-70">
                            {STATUS_LABEL[a.status] ?? a.status}
                          </span>
                          {paid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300">
                              <CreditCardIcon className="h-3 w-3" />
                              seña pagada
                            </span>
                          ) : a.status === "PENDING_PAYMENT" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300">
                              <ClockIcon className="h-3 w-3" />
                              pendiente
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Vista desktop: semana */}
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid min-w-[900px] grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
          {/* Header: corner + days */}
          <div className="border-b border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950" />
          {days.map((d) => {
            const isToday = isSameDay(d, today);
            return (
              <div
                key={d.toISOString()}
                className={`border-b border-r border-zinc-200 px-2 py-2.5 text-center text-sm dark:border-zinc-800 ${
                  isToday ? "bg-sky-50/50 dark:bg-sky-950/20" : "bg-zinc-50 dark:bg-zinc-950"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {format(d, "EEE", { locale: es })}
                </div>
                <div className="mt-0.5 flex items-center justify-center">
                  {isToday ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white shadow-sm shadow-sky-500/30">
                      {format(d, "d")}
                    </span>
                  ) : (
                    <span className="text-sm font-medium">{format(d, "d MMM", { locale: es })}</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Hours column */}
          <div className="relative border-r border-zinc-200 dark:border-zinc-800" style={{ height: DAY_HEIGHT }}>
            {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 -translate-y-1/2 pr-2 text-right text-[10px] text-zinc-500"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {String(START_HOUR + i).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const colAppts = appointments.filter((a) => isSameDay(a.startsAt, d));
            const isToday = isSameDay(d, today);
            return (
              <div
                key={`col-${d.toISOString()}`}
                className={`group/col relative border-r border-zinc-200 transition hover:bg-sky-50/30 dark:border-zinc-800 dark:hover:bg-sky-950/10 ${
                  isToday ? "bg-sky-50/20 dark:bg-sky-950/10" : ""
                }`}
                style={{ height: DAY_HEIGHT }}
              >
                {/* Hour grid lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-b border-zinc-100 dark:border-zinc-800/60"
                    style={{ top: (i + 1) * HOUR_HEIGHT - 1, height: 1 }}
                  />
                ))}

                {/* Now line: solo en la columna de hoy */}
                {isToday && (
                  <NowLine
                    startHour={START_HOUR}
                    endHour={END_HOUR}
                    hourHeight={HOUR_HEIGHT}
                  />
                )}

                {colAppts.map((a) => {
                  const startMin = Math.max(0, minutesFromStart(a.startsAt));
                  const endMin = Math.min(TOTAL_HOURS * 60, minutesFromStart(a.endsAt));
                  const top = (startMin / 60) * HOUR_HEIGHT;
                  const durationHeight = ((endMin - startMin) / 60) * HOUR_HEIGHT - 3;
                  const height = Math.max(56, durationHeight);
                  const showStaff = height >= 68;
                  const cfg = STATUS_STYLES[a.status] ?? {
                    box: "bg-zinc-50 text-zinc-700",
                    bar: "border-zinc-400",
                  };
                  const paid = a.payments.some((p) => p.status === "APPROVED");
                  const statusLabel = STATUS_LABEL[a.status] ?? a.status;
                  return (
                    <Link
                      key={a.id}
                      href={`/admin/appointments/${a.id}`}
                      title={`${format(a.startsAt, "HH:mm")} - ${format(a.endsAt, "HH:mm")} | ${a.customerName} | ${a.service.name} | ${a.staff.name} | ${statusLabel}`}
                      className={`absolute left-1.5 right-1.5 z-10 overflow-hidden rounded-lg border-l-4 px-2 py-1.5 text-[11px] leading-tight shadow-sm ring-1 ring-black/5 transition hover:z-20 hover:shadow-md ${cfg.box} ${cfg.bar}`}
                      style={{ top, height }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-semibold">
                          {format(a.startsAt, "HH:mm")} - {format(a.endsAt, "HH:mm")}
                        </span>
                        {paid ? (
                          <CreditCardIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : a.status === "PENDING_PAYMENT" ? (
                          <ClockIcon className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        ) : null}
                      </div>
                      <div className="mt-0.5 truncate font-semibold">
                        {a.customerName}
                      </div>
                      <div className="truncate text-[10px] opacity-80">
                        {a.service.name}
                        {showStaff ? ` | ${a.staff.name}` : ""}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <Legend dot="bg-emerald-500" label="Confirmado" />
        <Legend dot="bg-amber-500" label="Pendiente de pago" />
        <Legend dot="bg-zinc-400" label="Completado" />
        <Legend dot="bg-red-500" label="No se presentó" />
        {cursorIsToday && (
          <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
            <span className="hidden sm:inline">Línea sky:</span> hora actual
          </span>
        )}
      </div>
    </div>
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
