import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  subMonths,
  subDays,
  addDays,
  differenceInCalendarDays,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantPlanUsage } from "@/lib/plan-limits";
import {
  activePendingPaymentAppointmentWhere,
  blockingAppointmentWhere,
  visibleAppointmentWhere,
} from "@/lib/payment-holds";
import { EmptyState } from "./_components/EmptyState";
import { Avatar } from "./_components/Avatar";
import { StatusBadge } from "./_components/StatusBadge";
import { PlanUsageAlerts } from "./_components/PlanUsage";
import { RangeSelector, type RangeKey } from "./_components/RangeSelector";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ClockIcon,
  CreditCardIcon,
  DashboardIcon,
  ScissorsIcon,
  UsersIcon,
} from "./_components/AdminIcons";

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function fmtMoney(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("es-AR")}`;
}

type Range = {
  key: RangeKey;
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  compareLabel: string;
  rangeLabel: string;
};

function resolveRange(key: RangeKey, now: Date): Range {
  const today = startOfDay(now);
  switch (key) {
    case "today": {
      const start = today;
      const end = endOfDay(now);
      return {
        key,
        start,
        end,
        prevStart: subDays(start, 1),
        prevEnd: endOfDay(subDays(now, 1)),
        compareLabel: "vs. ayer",
        rangeLabel: "hoy",
      };
    }
    case "7d": {
      const start = subDays(today, 6);
      const end = endOfDay(now);
      return {
        key,
        start,
        end,
        prevStart: subDays(start, 7),
        prevEnd: subDays(end, 7),
        compareLabel: "vs. 7 días previos",
        rangeLabel: "últimos 7 días",
      };
    }
    case "30d": {
      const start = subDays(today, 29);
      const end = endOfDay(now);
      return {
        key,
        start,
        end,
        prevStart: subDays(start, 30),
        prevEnd: subDays(end, 30),
        compareLabel: "vs. 30 días previos",
        rangeLabel: "últimos 30 días",
      };
    }
    case "month":
    default: {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return {
        key: "month",
        start,
        end,
        prevStart: startOfMonth(subMonths(now, 1)),
        prevEnd: endOfMonth(subMonths(now, 1)),
        compareLabel: "vs. mes pasado",
        rangeLabel: format(now, "MMMM", { locale: es }),
      };
    }
  }
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; range?: string }>;
}) {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const sp = await searchParams;

  const rangeKey: RangeKey =
    sp.range === "today" || sp.range === "7d" || sp.range === "30d"
      ? sp.range
      : "month";

  const now = new Date();
  const range = resolveRange(rangeKey, now);
  const next24h = addDays(now, 1);
  const next48h = addDays(now, 2);
  const last7DayStart = subDays(startOfDay(now), 6);

  const [
    tenant,
    rangeAppointments,
    prevAppointments,
    newCustomers,
    prevNewCustomers,
    upcoming,
    pendingNext24h,
    paymentsPendingNext48h,
    noShowsRecent,
    topServicesRaw,
    planUsage,
    activeStaff,
    staffSchedules,
    depositsCollectedAgg,
    depositsPendingAgg,
  ] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { calendarStartHour: true, calendarEndHour: true },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId,
        startsAt: { gte: range.start, lte: range.end },
        AND: [visibleAppointmentWhere(now)],
      },
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        serviceId: true,
        staffId: true,
        customerId: true,
        priceCents: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId,
        startsAt: { gte: range.prevStart, lte: range.prevEnd },
        AND: [visibleAppointmentWhere(now)],
      },
      select: { id: true, status: true, priceCents: true },
    }),
    prisma.customer.count({
      where: { tenantId, createdAt: { gte: range.start, lte: range.end } },
    }),
    prisma.customer.count({
      where: { tenantId, createdAt: { gte: range.prevStart, lte: range.prevEnd } },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId,
        startsAt: { gte: now },
        AND: [blockingAppointmentWhere(now)],
      },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { service: true, staff: true, payments: true },
    }),
    prisma.appointment.count({
      where: {
        tenantId,
        startsAt: { gte: now, lte: next24h },
        AND: [activePendingPaymentAppointmentWhere(now)],
      },
    }),
    prisma.appointment.count({
      where: {
        tenantId,
        startsAt: { gte: now, lte: next48h },
        AND: [activePendingPaymentAppointmentWhere(now)],
      },
    }),
    prisma.appointment.count({
      where: {
        tenantId,
        status: "NO_SHOW",
        startsAt: { gte: last7DayStart, lte: now },
      },
    }),
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: {
        tenantId,
        startsAt: { gte: range.start, lte: range.end },
        AND: [visibleAppointmentWhere(now)],
      },
      _count: { _all: true },
      _sum: { priceCents: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 5,
    }),
    getTenantPlanUsage(tenantId),
    prisma.staff.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true },
    }),
    prisma.staffSchedule.findMany({
      where: { staff: { tenantId, active: true } },
      select: { weekday: true, startMin: true, endMin: true },
    }),
    // Señas cobradas: pagos aprobados de turnos cuyo inicio cae en el rango.
    prisma.payment.aggregate({
      where: {
        tenantId,
        status: "APPROVED",
        appointment: { startsAt: { gte: range.start, lte: range.end } },
      },
      _sum: { amountCents: true },
      _count: true,
    }),
    // Señas pendientes: turnos futuros con seña requerida aún en ventana de pago.
    prisma.appointment.aggregate({
      where: {
        tenantId,
        startsAt: { gte: now },
        depositCents: { gt: 0 },
        AND: [activePendingPaymentAppointmentWhere(now)],
      },
      _sum: { depositCents: true },
      _count: true,
    }),
  ]);

  const totalRange = rangeAppointments.length;
  const totalPrev = prevAppointments.length;
  const confirmedRange = rangeAppointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "COMPLETED",
  ).length;
  const cancelledRange = rangeAppointments.filter(
    (a) => a.status === "CANCELLED" || a.status === "NO_SHOW",
  ).length;
  const cancelledPrev = prevAppointments.filter(
    (a) => a.status === "CANCELLED" || a.status === "NO_SHOW",
  ).length;
  const confirmRate = totalRange > 0 ? (confirmedRange / totalRange) * 100 : 0;
  const cancelRate = totalRange > 0 ? (cancelledRange / totalRange) * 100 : 0;
  const cancelRatePrev = totalPrev > 0 ? (cancelledPrev / totalPrev) * 100 : 0;

  const completedRange = rangeAppointments.filter((a) => a.status === "COMPLETED");
  const completedPrev = prevAppointments.filter((a) => a.status === "COMPLETED");
  const revenueCents = completedRange.reduce((sum, a) => sum + a.priceCents, 0);
  const revenuePrevCents = completedPrev.reduce((sum, a) => sum + a.priceCents, 0);
  const completedCount = completedRange.length;
  const completedPrevCount = completedPrev.length;
  const ticketAvg = completedCount > 0 ? revenueCents / completedCount : 0;
  const ticketAvgPrev = completedPrevCount > 0 ? revenuePrevCents / completedPrevCount : 0;

  const totalDelta = pctDelta(totalRange, totalPrev);
  const revenueDelta = pctDelta(revenueCents, revenuePrevCents);
  const ticketDelta = pctDelta(ticketAvg, ticketAvgPrev);
  const customersDelta = pctDelta(newCustomers, prevNewCustomers);
  const cancelDelta = pctDelta(cancelRate, cancelRatePrev);

  // Top servicios — ya hicimos groupBy, ahora resolvemos nombres
  const serviceIds = topServicesRaw.map((t) => t.serviceId);
  const services =
    serviceIds.length > 0
      ? await prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : [];
  const serviceMap = new Map(services.map((s) => [s.id, s.name]));
  const topServices = topServicesRaw.map((t) => ({
    id: t.serviceId,
    name: serviceMap.get(t.serviceId) ?? "Servicio",
    count: t._count._all,
    revenueCents: t._sum.priceCents ?? 0,
  }));
  const topServicesMaxCount = Math.max(1, ...topServices.map((s) => s.count));

  // Desglose por profesional — se computa en memoria desde rangeAppointments (sin query extra).
  // Solo tiene sentido mostrarlo cuando el negocio tiene más de un profesional activo.
  const staffMap = new Map(activeStaff.map((s) => [s.id, s.name]));
  const perStaffMap = new Map<
    string,
    { count: number; completed: number; revenueCents: number }
  >();
  for (const a of rangeAppointments) {
    const entry = perStaffMap.get(a.staffId) ?? {
      count: 0,
      completed: 0,
      revenueCents: 0,
    };
    entry.count += 1;
    if (a.status === "COMPLETED") {
      entry.completed += 1;
      entry.revenueCents += a.priceCents;
    }
    perStaffMap.set(a.staffId, entry);
  }
  const perStaff = [...perStaffMap.entries()]
    .map(([id, v]) => ({ id, name: staffMap.get(id) ?? "Profesional", ...v }))
    .sort((a, b) => b.count - a.count || b.revenueCents - a.revenueCents);
  const perStaffMaxCount = Math.max(1, ...perStaff.map((s) => s.count));
  const showPerStaff = activeStaff.length > 1 && perStaff.length > 0;

  // Ocupación: minutos reservados vs. capacidad según horarios configurados,
  // medido sólo sobre la porción del rango que ya transcurrió (hasta ahora).
  const scheduleMinByWeekday = new Map<number, number>();
  for (const s of staffSchedules) {
    scheduleMinByWeekday.set(
      s.weekday,
      (scheduleMinByWeekday.get(s.weekday) ?? 0) + Math.max(0, s.endMin - s.startMin),
    );
  }
  const occEnd = range.end < now ? range.end : now;
  let capacityMin = 0;
  if (scheduleMinByWeekday.size > 0 && occEnd >= range.start) {
    for (let d = startOfDay(range.start); d <= occEnd; d = addDays(d, 1)) {
      capacityMin += scheduleMinByWeekday.get(d.getDay()) ?? 0;
    }
  }
  let bookedMin = 0;
  for (const a of rangeAppointments) {
    if (a.startsAt > occEnd) continue;
    if (a.status !== "CONFIRMED" && a.status !== "COMPLETED") continue;
    bookedMin += Math.max(0, (a.endsAt.getTime() - a.startsAt.getTime()) / 60_000);
  }
  const occupancyRate =
    capacityMin > 0 ? Math.min(100, (bookedMin / capacityMin) * 100) : null;

  // Ingresos proyectados: turnos confirmados a futuro dentro del rango.
  const projectedAppts = rangeAppointments.filter(
    (a) => a.status === "CONFIRMED" && a.startsAt > now,
  );
  const projectedCents = projectedAppts.reduce((sum, a) => sum + a.priceCents, 0);
  const projectedCount = projectedAppts.length;

  // Señas
  const depositsCollectedCents = depositsCollectedAgg._sum.amountCents ?? 0;
  const depositsCollectedCount = depositsCollectedAgg._count;
  const depositsPendingCents = depositsPendingAgg._sum.depositCents ?? 0;
  const depositsPendingCount = depositsPendingAgg._count;

  // Recurrencia: de los clientes con turno en el rango, cuántos ya habían venido
  // antes (más de un turno en su historial visible).
  const rangeCustomerIds = [
    ...new Set(
      rangeAppointments
        .map((a) => a.customerId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  let recurrenceRate: number | null = null;
  let returningCustomers = 0;
  const distinctCustomers = rangeCustomerIds.length;
  if (rangeCustomerIds.length > 0) {
    const lifetimeCounts = await prisma.appointment.groupBy({
      by: ["customerId"],
      where: {
        tenantId,
        customerId: { in: rangeCustomerIds },
        AND: [visibleAppointmentWhere(now)],
      },
      _count: { _all: true },
    });
    returningCustomers = lifetimeCounts.filter((g) => g._count._all > 1).length;
    recurrenceRate =
      distinctCustomers > 0 ? (returningCustomers / distinctCustomers) * 100 : null;
  }

  // Heatmap: día de semana × hora
  const calStart = tenant?.calendarStartHour ?? 8;
  const calEnd = tenant?.calendarEndHour ?? 22;
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0]; // Lun..Dom (0 = Dom en JS)
  const weekdayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const hours: number[] = [];
  for (let h = calStart; h < calEnd; h++) hours.push(h);
  const heatmap: number[][] = weekdayOrder.map(() => hours.map(() => 0));
  for (const a of rangeAppointments) {
    const d = a.startsAt;
    const wIdx = weekdayOrder.indexOf(d.getDay());
    if (wIdx === -1) continue;
    const hIdx = d.getHours() - calStart;
    if (hIdx < 0 || hIdx >= hours.length) continue;
    heatmap[wIdx][hIdx]++;
  }
  const heatmapMax = Math.max(1, ...heatmap.flat());

  // Banda "necesita atención"
  type Attention = { count: number; label: string; href: string; tone: "amber" | "red" };
  const attentionItems: Attention[] = [];
  if (pendingNext24h > 0) {
    attentionItems.push({
      count: pendingNext24h,
      label:
        pendingNext24h === 1
          ? "turno sin confirmar en próximas 24 h"
          : "turnos sin confirmar en próximas 24 h",
      href: "/admin/appointments",
      tone: "amber",
    });
  }
  const between24and48 = Math.max(0, paymentsPendingNext48h - pendingNext24h);
  if (between24and48 > 0) {
    attentionItems.push({
      count: between24and48,
      label:
        between24and48 === 1
          ? "turno con pago pendiente en 24-48 h"
          : "turnos con pago pendiente en 24-48 h",
      href: "/admin/appointments",
      tone: "amber",
    });
  }
  if (noShowsRecent > 0) {
    attentionItems.push({
      count: noShowsRecent,
      label:
        noShowsRecent === 1
          ? "no-show en los últimos 7 días"
          : "no-shows en los últimos 7 días",
      href: "/admin/appointments",
      tone: "red",
    });
  }

  const rangeDays = differenceInCalendarDays(range.end, range.start) + 1;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Resumen</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Hola {session!.user.name ?? session!.user.email}, esto es lo que pasa en tu negocio.
          </p>
        </div>
        <RangeSelector current={range.key} />
      </header>

      {sp.billing === "return" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Volviste de Mercado Pago. Si el pago quedó aprobado, la suscripción se actualiza por webhook.
        </div>
      )}

      <PlanUsageAlerts usage={planUsage} />

      {attentionItems.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
              !
            </span>
            Necesita tu atención
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {attentionItems.map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg border bg-white p-3 transition hover:shadow-sm dark:bg-zinc-900 ${
                    item.tone === "red"
                      ? "border-red-200 dark:border-red-900/60"
                      : "border-amber-200 dark:border-amber-900/60"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      item.tone === "red"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {item.count}
                  </span>
                  <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {item.label}
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<DashboardIcon className="h-5 w-5" />}
          accent="sky"
          label={`Turnos · ${range.rangeLabel}`}
          value={String(totalRange)}
          delta={totalDelta}
          deltaLabel={range.compareLabel}
        />
        <StatCard
          icon={<ClipboardIcon className="h-5 w-5" />}
          accent="emerald"
          label="Confirmados"
          value={`${confirmRate.toFixed(0)}%`}
          subtext={`${confirmedRange} de ${totalRange}`}
        />
        <StatCard
          icon={<ClockIcon className="h-5 w-5" />}
          accent="rose"
          label="Cancelados / no-show"
          value={`${cancelRate.toFixed(0)}%`}
          delta={cancelDelta}
          deltaLabel={range.compareLabel}
          inverted
          subtext={`${cancelledRange} de ${totalRange}`}
        />
        <StatCard
          icon={<CreditCardIcon className="h-5 w-5" />}
          accent="amber"
          label="Ingresos"
          value={fmtMoney(revenueCents)}
          delta={revenueDelta}
          deltaLabel={range.compareLabel}
          subtext={`${completedCount} ${
            completedCount === 1 ? "turno completado" : "turnos completados"
          }`}
        />
        <StatCard
          icon={<CreditCardIcon className="h-5 w-5" />}
          accent="violet"
          label="Ticket promedio"
          value={completedCount > 0 ? fmtMoney(ticketAvg) : "—"}
          delta={ticketDelta}
          deltaLabel={range.compareLabel}
          subtext={completedCount > 0 ? "por turno completado" : undefined}
        />
        <StatCard
          icon={<UsersIcon className="h-5 w-5" />}
          accent="sky"
          label="Clientes nuevos"
          value={String(newCustomers)}
          delta={customersDelta}
          deltaLabel={range.compareLabel}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={<ClockIcon className="h-5 w-5" />}
          accent="sky"
          label="Ocupación"
          value={occupancyRate != null ? `${occupancyRate.toFixed(0)}%` : "—"}
          subtext={
            occupancyRate != null
              ? `${Math.round(bookedMin / 60)} h de ${Math.round(capacityMin / 60)} h agendables`
              : "Configurá horarios del equipo"
          }
        />
        <StatCard
          icon={<CalendarIcon className="h-5 w-5" />}
          accent="emerald"
          label="Ingresos proyectados"
          value={projectedCount > 0 ? fmtMoney(projectedCents) : "—"}
          subtext={
            projectedCount > 0
              ? `${projectedCount} ${projectedCount === 1 ? "turno confirmado" : "turnos confirmados"} a futuro`
              : "Sin confirmados a futuro en el rango"
          }
        />
        <StatCard
          icon={<CreditCardIcon className="h-5 w-5" />}
          accent="violet"
          label="Señas cobradas"
          value={fmtMoney(depositsCollectedCents)}
          subtext={`${depositsCollectedCount} ${depositsCollectedCount === 1 ? "pago aprobado" : "pagos aprobados"}`}
        />
        <StatCard
          icon={<CreditCardIcon className="h-5 w-5" />}
          accent="amber"
          label="Señas pendientes"
          value={fmtMoney(depositsPendingCents)}
          subtext={`${depositsPendingCount} ${depositsPendingCount === 1 ? "turno esperando pago" : "turnos esperando pago"}`}
        />
        <StatCard
          icon={<UsersIcon className="h-5 w-5" />}
          accent="rose"
          label="Recurrencia"
          value={recurrenceRate != null ? `${recurrenceRate.toFixed(0)}%` : "—"}
          subtext={
            recurrenceRate != null
              ? `${returningCustomers} de ${distinctCustomers} ya habían venido`
              : "Sin clientes registrados en el rango"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Próximos turnos */}
        <section className="min-w-0 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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

        {/* Top servicios */}
        <section className="min-w-0 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Top servicios
            </h2>
            <Link
              href="/admin/services"
              className="text-xs text-sky-600 hover:underline dark:text-sky-400"
            >
              Ver todos →
            </Link>
          </div>
          {topServices.length === 0 ? (
            <EmptyState
              icon={<ScissorsIcon className="h-6 w-6" />}
              title="Sin datos en este rango"
              description="Cuando haya turnos en el período, vas a ver el ranking acá."
            />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {topServices.map((svc, i) => {
                const widthPct = (svc.count / topServicesMaxCount) * 100;
                return (
                  <li key={svc.id} className="px-5 py-3">
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {i + 1}
                        </span>
                        <span className="truncate font-medium">{svc.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {svc.count} · {fmtMoney(svc.revenueCents)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Por profesional */}
      {showPerStaff && (
        <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Por profesional · {range.rangeLabel}
            </h2>
            <Link
              href="/admin/staff"
              className="text-xs text-sky-600 hover:underline dark:text-sky-400"
            >
              Ver equipo →
            </Link>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {perStaff.map((member) => {
              const widthPct = (member.count / perStaffMaxCount) * 100;
              const completionRate =
                member.count > 0 ? (member.completed / member.count) * 100 : 0;
              return (
                <li key={member.id} className="px-5 py-3">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar name={member.name} size="sm" />
                      <span className="truncate text-sm font-medium">{member.name}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs text-zinc-500">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {fmtMoney(member.revenueCents)}
                      </span>
                      <span className="mx-1">·</span>
                      {member.count} {member.count === 1 ? "turno" : "turnos"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right text-[10px] text-zinc-400">
                      {member.completed}/{member.count} compl. ({completionRate.toFixed(0)}%)
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Heatmap */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Actividad por día y hora
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {totalRange} {totalRange === 1 ? "turno" : "turnos"} en {rangeDays}{" "}
              {rangeDays === 1 ? "día" : "días"} · franja {String(calStart).padStart(2, "0")}:00–
              {String(calEnd).padStart(2, "0")}:00
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span>menos</span>
            <span className="h-3 w-3 rounded-sm bg-zinc-100 dark:bg-zinc-800" />
            <span className="h-3 w-3 rounded-sm bg-sky-200 dark:bg-sky-950/60" />
            <span className="h-3 w-3 rounded-sm bg-sky-400 dark:bg-sky-800/80" />
            <span className="h-3 w-3 rounded-sm bg-sky-500 dark:bg-sky-700" />
            <span className="h-3 w-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
            <span>más</span>
          </div>
        </div>

        {totalRange === 0 ? (
          <EmptyState
            icon={<CalendarIcon className="h-6 w-6" />}
            title="Sin actividad en este rango"
            description="Probá ampliar el rango o esperar a que haya turnos en el período."
          />
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `auto repeat(${hours.length}, minmax(18px, 1fr))`,
              }}
            >
              <div />
              {hours.map((h) => (
                <div
                  key={h}
                  className="text-center text-[9px] uppercase tracking-wider text-zinc-400"
                >
                  {h % 3 === 0 ? `${String(h).padStart(2, "0")}` : ""}
                </div>
              ))}
              {weekdayLabels.map((label, wIdx) => (
                <Row
                  key={label}
                  label={label}
                  cells={heatmap[wIdx]}
                  hours={hours}
                  max={heatmapMax}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({
  label,
  cells,
  hours,
  max,
}: {
  label: string;
  cells: number[];
  hours: number[];
  max: number;
}) {
  return (
    <>
      <div className="pr-2 text-right text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      {cells.map((c, i) => {
        const intensity = c / max; // 0..1
        const cls =
          c === 0
            ? "bg-zinc-100 dark:bg-zinc-800"
            : intensity < 0.25
              ? "bg-sky-200 dark:bg-sky-950/60"
              : intensity < 0.5
                ? "bg-sky-400 dark:bg-sky-800/80"
                : intensity < 0.75
                  ? "bg-sky-500 dark:bg-sky-700"
                  : "bg-emerald-500 dark:bg-emerald-600";
        return (
          <div
            key={i}
            className={`aspect-square rounded-sm ${cls}`}
            title={`${label} ${String(hours[i]).padStart(2, "0")}:00 — ${c} ${c === 1 ? "turno" : "turnos"}`}
          />
        );
      })}
    </>
  );
}

const ACCENTS: Record<string, string> = {
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300",
};

function StatCard({
  icon,
  accent,
  label,
  value,
  delta,
  deltaLabel,
  subtext,
  inverted = false,
}: {
  icon: React.ReactNode;
  accent: keyof typeof ACCENTS;
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  subtext?: string;
  inverted?: boolean;
}) {
  const positive = delta != null && delta >= 0;
  // Para métricas "malas" (cancelaciones), un delta positivo se muestra en rojo.
  const goodDirection = inverted ? !positive : positive;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACCENTS[accent]}`}>
          {icon}
        </span>
        {delta != null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              goodDirection
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
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">{label}</p>
      {subtext && <p className="mt-0.5 text-[10px] text-zinc-400">{subtext}</p>}
    </div>
  );
}
