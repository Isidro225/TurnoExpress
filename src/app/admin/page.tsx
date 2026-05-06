import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  subMonths,
  subDays,
  addDays,
  format,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantPlanUsage } from "@/lib/plan-limits";
import { PageHeader } from "./_components/PageHeader";
import { EmptyState } from "./_components/EmptyState";
import { Avatar } from "./_components/Avatar";
import { StatusBadge } from "./_components/StatusBadge";
import { PlanUsageAlerts } from "./_components/PlanUsage";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ClipboardIcon,
  ClockIcon,
  CreditCardIcon,
  DashboardIcon,
} from "./_components/AdminIcons";

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const sp = await searchParams;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));
  const yesterdayStart = startOfDay(subDays(now, 1));
  const yesterdayEnd = endOfDay(subDays(now, 1));

  const [
    totalToday,
    totalYesterday,
    totalMonth,
    totalPrevMonth,
    confirmedMonth,
    revenueMonth,
    revenuePrevMonth,
    last7Days,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { tenantId, startsAt: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    prisma.appointment.count({
      where: { tenantId, startsAt: { gte: yesterdayStart, lte: yesterdayEnd } },
    }),
    prisma.appointment.count({
      where: { tenantId, startsAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.appointment.count({
      where: { tenantId, startsAt: { gte: prevMonthStart, lte: prevMonthEnd } },
    }),
    prisma.appointment.count({
      where: {
        tenantId,
        status: "CONFIRMED",
        startsAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.payment.aggregate({
      where: {
        tenantId,
        status: "APPROVED",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: {
        tenantId,
        status: "APPROVED",
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      _sum: { amountCents: true },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId,
        startsAt: { gte: subDays(startOfDay(now), 6), lte: endOfDay(now) },
      },
      select: { startsAt: true },
    }),
  ]);

  const [upcoming, planUsage] = await Promise.all([
    prisma.appointment.findMany({
      where: { tenantId, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { service: true, staff: true, payments: true },
    }),
    getTenantPlanUsage(tenantId),
  ]);

  // Construir buckets para últimos 7 días
  const days7 = Array.from({ length: 7 }, (_, i) => subDays(startOfDay(now), 6 - i));
  const counts7 = days7.map((d) => last7Days.filter((a) => isSameDay(a.startsAt, d)).length);
  const max7 = Math.max(1, ...counts7);

  const dayDelta = pctDelta(totalToday, totalYesterday);
  const monthDelta = pctDelta(totalMonth, totalPrevMonth);
  const revenueCents = revenueMonth._sum.amountCents ?? 0;
  const revenuePrevCents = revenuePrevMonth._sum.amountCents ?? 0;
  const revenueDelta = pctDelta(revenueCents, revenuePrevCents);
  const confirmRate = totalMonth > 0 ? (confirmedMonth / totalMonth) * 100 : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resumen"
        description={`Hola ${session!.user.name ?? session!.user.email}, esto es lo que pasa hoy en tu negocio.`}
      />

      {sp.billing === "return" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Volviste de Mercado Pago. Si el pago quedÃ³ aprobado, la suscripciÃ³n se actualiza por webhook.
        </div>
      )}

      <PlanUsageAlerts usage={planUsage} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<DashboardIcon className="h-5 w-5" />}
          accent="sky"
          label="Turnos hoy"
          value={String(totalToday)}
          delta={dayDelta}
          deltaLabel="vs. ayer"
        />
        <StatCard
          icon={<CalendarIcon className="h-5 w-5" />}
          accent="violet"
          label="Turnos del mes"
          value={String(totalMonth)}
          delta={monthDelta}
          deltaLabel="vs. mes pasado"
        />
        <StatCard
          icon={<ClipboardIcon className="h-5 w-5" />}
          accent="emerald"
          label="Tasa de confirmados"
          value={`${confirmRate.toFixed(0)}%`}
          subtext={`${confirmedMonth} de ${totalMonth} este mes`}
        />
        <StatCard
          icon={<CreditCardIcon className="h-5 w-5" />}
          accent="amber"
          label="Ingresos del mes"
          value={`$${(revenueCents / 100).toLocaleString("es-AR")}`}
          delta={revenueDelta}
          deltaLabel="vs. mes pasado"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Próximos turnos */}
        <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Próximos turnos
            </h2>
            <Link
              href="/admin/appointments"
              className="text-xs text-sky-600 hover:underline dark:text-sky-400"
            >
              Ver todos →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<ClockIcon className="h-6 w-6" />}
              title="Todavía no hay turnos próximos"
              description="Cuando tus clientes reserven, los vas a ver acá ordenados por hora."
            />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {upcoming.map((appt) => {
                const paid = appt.payments.some((p) => p.status === "APPROVED");
                return (
                  <li key={appt.id}>
                    <Link
                      href={`/admin/appointments/${appt.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
                      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-zinc-50 px-1 py-1.5 text-center dark:bg-zinc-800">
                        <span className="text-base font-bold leading-tight">
                          {format(appt.startsAt, "HH:mm")}
                        </span>
                        <span className="text-[9px] uppercase text-zinc-500">
                          {format(appt.startsAt, "d MMM", { locale: es })}
                        </span>
                      </div>
                      <Avatar name={appt.customerName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{appt.customerName}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {appt.service.name} · {appt.staff.name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={appt.status} />
                        {paid && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                            <CreditCardIcon className="h-3 w-3" />
                            seña pagada
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Sparkline últimos 7 días */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Últimos 7 días
            </h2>
            <span className="text-xs text-zinc-500">
              {counts7.reduce((a, b) => a + b, 0)} turnos
            </span>
          </div>
          <div className="mt-5 flex h-32 items-end gap-2">
            {counts7.map((c, i) => {
              const isToday = isSameDay(days7[i], now);
              const h = (c / max7) * 100;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t-md transition ${
                        isToday
                          ? "bg-gradient-to-t from-sky-500 to-emerald-500"
                          : "bg-zinc-200 group-hover:bg-zinc-300 dark:bg-zinc-700"
                      }`}
                      style={{ height: `${Math.max(h, c > 0 ? 8 : 2)}%` }}
                      title={`${format(days7[i], "EEE d", { locale: es })}: ${c} turnos`}
                    />
                    {c > 0 && (
                      <span
                        className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold ${
                          isToday ? "text-sky-600 dark:text-sky-400" : "text-zinc-500"
                        }`}
                      >
                        {c}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wider ${
                      isToday ? "font-bold text-sky-600 dark:text-sky-400" : "text-zinc-500"
                    }`}
                  >
                    {format(days7[i], "EEE", { locale: es }).slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
            <span>{format(addDays(days7[0], 0), "d MMM", { locale: es })}</span>
            <span>Hoy</span>
          </div>
        </section>
      </div>
    </div>
  );
}

const ACCENTS: Record<string, string> = {
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
};

function StatCard({
  icon,
  accent,
  label,
  value,
  delta,
  deltaLabel,
  subtext,
}: {
  icon: React.ReactNode;
  accent: keyof typeof ACCENTS;
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  subtext?: string;
}) {
  const positive = delta != null && delta >= 0;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${ACCENTS[accent]}`}>
          {icon}
        </span>
        {delta != null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              positive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
            }`}
            title={deltaLabel}
          >
            {positive ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
      {subtext && <p className="mt-0.5 text-[11px] text-zinc-400">{subtext}</p>}
      {delta != null && deltaLabel && (
        <p className="mt-0.5 text-[11px] text-zinc-400">{deltaLabel}</p>
      )}
    </div>
  );
}
