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

const HOUR_HEIGHT = 48;
const START_HOUR = 7;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const DAY_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 border-emerald-400 text-emerald-900",
  PENDING_PAYMENT: "bg-amber-100 border-amber-400 text-amber-900",
  COMPLETED: "bg-zinc-200 border-zinc-400 text-zinc-700",
  NO_SHOW: "bg-red-100 border-red-400 text-red-900",
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
    include: { service: true, staff: true },
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Calendario</h1>
        <form className="flex items-center gap-2">
          <select
            name="staff"
            defaultValue={sp.staff ?? ""}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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

      {/* Navegación: semana en desktop, día en mobile */}
      <div className="hidden items-center justify-between md:flex">
        <p className="text-sm text-zinc-500">
          Semana del {format(weekStart, "d MMM", { locale: es })} al{" "}
          {format(weekEnd, "d MMM yyyy", { locale: es })}
        </p>
        <div className="flex items-center gap-1">
          <Link
            href={buildHref({ date: addDays(weekStart, -7) })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            aria-label="Semana anterior"
          >
            ‹
          </Link>
          <Link
            href={buildHref({ date: new Date() })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Hoy
          </Link>
          <Link
            href={buildHref({ date: addDays(weekStart, 7) })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            aria-label="Semana siguiente"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between md:hidden">
        <p className="text-sm font-medium">
          {format(cursor, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        <div className="flex items-center gap-1">
          <Link
            href={buildHref({ date: addDays(cursor, -1) })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            aria-label="Día anterior"
          >
            ‹
          </Link>
          <Link
            href={buildHref({ date: new Date() })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Hoy
          </Link>
          <Link
            href={buildHref({ date: addDays(cursor, 1) })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            aria-label="Día siguiente"
          >
            ›
          </Link>
        </div>
      </div>

      {/* Vista mobile: lista del día */}
      <div className="md:hidden">
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {dayAppts.length === 0 ? (
            <p className="p-6 text-center text-sm text-zinc-500">
              No hay turnos para este día.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {dayAppts.map((a) => {
                const cls = STATUS_STYLES[a.status] ?? "bg-zinc-100 border-zinc-400";
                return (
                  <li key={a.id}>
                    <Link
                      href={`/admin/appointments/${a.id}`}
                      className="flex items-stretch gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-md bg-zinc-50 text-center dark:bg-zinc-800">
                        <span className="text-base font-semibold">
                          {format(a.startsAt, "HH:mm")}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {a.service.durationMin} min
                        </span>
                      </div>
                      <div className={`flex-1 rounded-md border-l-4 px-3 py-2 ${cls}`}>
                        <p className="font-medium">{a.customerName}</p>
                        <p className="text-sm">
                          {a.service.name} · {a.staff.name}
                        </p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-wider opacity-70">
                          {STATUS_LABEL[a.status] ?? a.status}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Vista desktop: grid semanal */}
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid min-w-[900px] grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
          <div className="border-b border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950" />
          {days.map((d) => {
            const isToday = isSameDay(d, new Date());
            return (
              <div
                key={d.toISOString()}
                className={`border-b border-r border-zinc-200 p-2 text-center text-sm dark:border-zinc-800 ${
                  isToday ? "bg-zinc-100 font-semibold dark:bg-zinc-800" : "bg-zinc-50 dark:bg-zinc-950"
                }`}
              >
                <div className="text-xs uppercase tracking-wider text-zinc-500">
                  {format(d, "EEE", { locale: es })}
                </div>
                <div>{format(d, "d MMM", { locale: es })}</div>
              </div>
            );
          })}

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

          {days.map((d) => {
            const colAppts = appointments.filter((a) => isSameDay(a.startsAt, d));
            return (
              <div
                key={`col-${d.toISOString()}`}
                className="relative border-r border-zinc-200 dark:border-zinc-800"
                style={{ height: DAY_HEIGHT }}
              >
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-b border-zinc-100 dark:border-zinc-800/60"
                    style={{ top: (i + 1) * HOUR_HEIGHT - 1, height: 1 }}
                  />
                ))}
                {colAppts.map((a) => {
                  const startMin = Math.max(0, minutesFromStart(a.startsAt));
                  const endMin = Math.min(TOTAL_HOURS * 60, minutesFromStart(a.endsAt));
                  const top = (startMin / 60) * HOUR_HEIGHT;
                  const height = Math.max(20, ((endMin - startMin) / 60) * HOUR_HEIGHT - 2);
                  const cls = STATUS_STYLES[a.status] ?? "bg-zinc-100 border-zinc-400";
                  return (
                    <Link
                      key={a.id}
                      href={`/admin/appointments/${a.id}`}
                      title={`${a.customerName} · ${a.service.name} · ${a.staff.name} · ${a.status}`}
                      className={`absolute left-1 right-1 overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-[11px] leading-tight transition hover:brightness-95 ${cls}`}
                      style={{ top, height }}
                    >
                      <div className="font-medium">
                        {format(a.startsAt, "HH:mm")} {a.customerName}
                      </div>
                      <div className="truncate">
                        {a.service.name} · {a.staff.name}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <Legend className="bg-emerald-100 border-emerald-400" label="Confirmado" />
        <Legend className="bg-amber-100 border-amber-400" label="Pendiente de pago" />
        <Legend className="bg-zinc-200 border-zinc-400" label="Completado" />
        <Legend className="bg-red-100 border-red-400" label="No se presentó" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded border-l-4 ${className}`} />
      {label}
    </span>
  );
}
