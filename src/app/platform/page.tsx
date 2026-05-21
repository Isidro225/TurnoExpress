import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  BILLING_PLANS,
  BILLING_PLAN_VALUES,
  BILLING_STATUS_VALUES,
  formatBillingPlanPrice,
  isBillingTrialActive,
  normalizeBillingPlan,
  type BillingPlanId,
} from "@/lib/billing-plans";
import {
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPE_VALUES,
  businessTypeLabel,
  normalizeBusinessType,
} from "@/lib/business-types";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { updateTenantActive } from "./actions";
import { TenantBillingControls } from "./TenantBillingControls";

const STATUS_LABELS: Record<string, string> = {
  trialing: "En prueba",
  pending: "Pendiente",
  active: "Activo",
  paused: "Pausado",
  cancelled: "Cancelado",
  past_due: "Pago vencido",
};

const STATUS_BADGE: Record<string, string> = {
  trialing: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  active: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  paused: "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  past_due: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
};

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

function formatDate(date: Date | null): string {
  if (!date) return "Sin prueba";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function statusClass(status: string): string {
  return STATUS_BADGE[status] ?? STATUS_BADGE.pending;
}

function normalizeFilter(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

async function getPlatformData(where: Prisma.TenantWhereInput) {
  return Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        businessType: true,
        slug: true,
        active: true,
        billingPlan: true,
        billingStatus: true,
        mpSubscriptionId: true,
        mpSubscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
        users: {
          orderBy: { createdAt: "asc" },
          take: 3,
          select: { email: true, name: true, role: true },
        },
        _count: {
          select: {
            users: true,
            staff: true,
            services: true,
            appointments: true,
          },
        },
      },
    }),
    prisma.tenant.findMany({
      select: {
        billingPlan: true,
        billingStatus: true,
        active: true,
        trialEndsAt: true,
      },
    }),
  ]);
}

export default async function PlatformPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    plan?: string;
    businessType?: string;
    status?: string;
    active?: string;
    billing?: string;
    mpSync?: string;
  }>;
}) {
  await requirePlatformAdmin();

  const sp = await searchParams;
  const q = normalizeFilter(sp.q);
  const plan = BILLING_PLAN_VALUES.includes(sp.plan as BillingPlanId)
    ? (sp.plan as BillingPlanId)
    : "";
  const businessType = normalizeBusinessType(sp.businessType) ?? "";
  const status = BILLING_STATUS_VALUES.includes(sp.status as (typeof BILLING_STATUS_VALUES)[number])
    ? String(sp.status)
    : "";
  const active =
    sp.active === "true" ? true : sp.active === "false" ? false : undefined;

  const and: Prisma.TenantWhereInput[] = [];
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { users: { some: { email: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  if (plan) and.push({ billingPlan: plan });
  if (businessType) and.push({ businessType });
  if (status) and.push({ billingStatus: status });
  if (active !== undefined) and.push({ active });

  const where: Prisma.TenantWhereInput = and.length ? { AND: and } : {};

  const platformData = await getPlatformData(where).catch((error: unknown) => {
    console.error("Platform data query failed", error);
    return null;
  });

  if (!platformData) {
    return <PlatformDatabaseError />;
  }

  const [tenants, allTenants] = platformData;

  const activeTenants = allTenants.filter((tenant) => tenant.active);
  const activeSubscriptions = activeTenants.filter((tenant) => tenant.billingStatus === "active");
  const trialingTenants = activeTenants.filter(
    (tenant) => tenant.billingStatus === "trialing" && isBillingTrialActive(tenant.trialEndsAt)
  );
  const activeMrr = activeSubscriptions.reduce(
    (sum, tenant) => sum + BILLING_PLANS[normalizeBillingPlan(tenant.billingPlan)].priceCents,
    0
  );
  const projectedMrr = activeTenants
    .filter((tenant) => tenant.billingStatus === "active" || tenant.billingStatus === "trialing")
    .reduce(
      (sum, tenant) => sum + BILLING_PLANS[normalizeBillingPlan(tenant.billingPlan)].priceCents,
      0
    );

  const planStats = BILLING_PLAN_VALUES.map((planId) => {
    const rows = allTenants.filter((tenant) => normalizeBillingPlan(tenant.billingPlan) === planId);
    const activeRows = rows.filter((tenant) => tenant.active);
    const payingRows = activeRows.filter((tenant) => tenant.billingStatus === "active");
    return {
      planId,
      total: rows.length,
      active: activeRows.length,
      mrr: payingRows.length * BILLING_PLANS[planId].priceCents,
    };
  });

  return (
    <div className="space-y-8">
      {sp.billing === "saved" && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            sp.mpSync === "failed"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
          }`}
        >
          {sp.mpSync === "failed"
            ? "Plan actualizado en TurnoExpress, pero no pudimos sincronizar el monto en Mercado Pago."
            : "Plan actualizado correctamente."}
        </div>
      )}

      {sp.billing === "not-found" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          No encontramos ese negocio para actualizarlo.
        </div>
      )}

      {sp.billing === "invalid" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          No pudimos guardar ese estado de facturación.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Negocios" value={String(allTenants.length)} hint={`${activeTenants.length} activos`} />
        <Metric label="En prueba" value={String(trialingTenants.length)} hint="Trials vigentes" />
        <Metric label="Suscripciones" value={String(activeSubscriptions.length)} hint="Estado active" />
        <Metric label="MRR activo" value={money(activeMrr)} hint={`${money(projectedMrr)} proyectado`} />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Planes
          </h2>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {planStats.map((stat) => {
            const planInfo = BILLING_PLANS[stat.planId];
            return (
              <div
                key={stat.planId}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{planInfo.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{planInfo.tagline}</p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-semibold text-sky-700 dark:text-sky-300">
                    {formatBillingPlanPrice(stat.planId)}
                    <span className="block text-[10px] font-normal text-zinc-500">/mes</span>
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <MiniStat label="Total" value={String(stat.total)} />
                  <MiniStat label="Activos" value={String(stat.active)} />
                  <MiniStat label="MRR" value={money(stat.mrr)} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Negocios asociados
            </h2>
            <p className="text-xs text-zinc-500">{tenants.length} resultados</p>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_150px_170px_150px_auto]" action="/platform">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por negocio, slug o email"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <select
              name="plan"
              defaultValue={plan}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todos los planes</option>
              {BILLING_PLAN_VALUES.map((planId) => (
                <option key={planId} value={planId}>
                  {BILLING_PLANS[planId].name}
                </option>
              ))}
            </select>
            <select
              name="businessType"
              defaultValue={businessType}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todos los rubros</option>
              {BUSINESS_TYPE_VALUES.map((type) => (
                <option key={type} value={type}>
                  {BUSINESS_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todos los estados</option>
              {BILLING_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </select>
            <select
              name="active"
              defaultValue={active === undefined ? "" : String(active)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            >
              Filtrar
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              <tr>
                <th className="px-5 py-3 font-semibold">Negocio</th>
                <th className="px-5 py-3 font-semibold">Cuenta</th>
                <th className="px-5 py-3 font-semibold">Uso</th>
                <th className="px-5 py-3 font-semibold">Prueba</th>
                <th className="px-5 py-3 font-semibold">Plan y estado</th>
                <th className="px-5 py-3 font-semibold">Actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tenants.map((tenant) => {
                const planId = normalizeBillingPlan(tenant.billingPlan);
                const statusOptions = BILLING_STATUS_VALUES.includes(
                  tenant.billingStatus as (typeof BILLING_STATUS_VALUES)[number]
                )
                  ? BILLING_STATUS_VALUES
                  : [tenant.billingStatus, ...BILLING_STATUS_VALUES];
                const trialActive = isBillingTrialActive(tenant.trialEndsAt);

                return (
                  <tr key={tenant.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                            {tenant.name}
                          </p>
                          {!tenant.active && (
                            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          <Link href={`/${tenant.slug}`} target="_blank" className="font-mono text-sky-600 hover:underline dark:text-sky-400">
                            /{tenant.slug}
                          </Link>
                          <span>{businessTypeLabel(tenant.businessType)}</span>
                          <span>Alta {formatDate(tenant.createdAt)}</span>
                        </div>
                        {tenant.mpSubscriptionId && (
                          <p className="truncate font-mono text-[11px] text-zinc-400">
                            MP {tenant.mpSubscriptionId}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {tenant.users.map((user) => (
                          <div key={user.email} className="text-xs">
                            <p className="font-medium text-zinc-700 dark:text-zinc-300">
                              {user.name ?? user.email}
                            </p>
                            <p className="text-zinc-500">{user.email}</p>
                          </div>
                        ))}
                        {tenant._count.users > tenant.users.length && (
                          <p className="text-[11px] text-zinc-500">
                            +{tenant._count.users - tenant.users.length} usuarios
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <MiniStat label="Staff" value={String(tenant._count.staff)} />
                        <MiniStat label="Serv." value={String(tenant._count.services)} />
                        <MiniStat label="Turnos" value={String(tenant._count.appointments)} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className={trialActive ? "font-medium text-emerald-700 dark:text-emerald-300" : "text-zinc-500"}>
                        {formatDate(tenant.trialEndsAt)}
                      </p>
                      {tenant.trialEndsAt && (
                        <p className="mt-1 text-xs text-zinc-500">
                          {trialActive ? "Vigente" : "Finalizada"}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <TenantBillingControls
                          tenantId={tenant.id}
                          planId={planId}
                          billingStatus={tenant.billingStatus}
                          statusOptions={[...statusOptions]}
                        />
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass(tenant.billingStatus)}`}>
                            {statusLabel(tenant.billingStatus)}
                          </span>
                          {tenant.mpSubscriptionStatus && (
                            <span className="font-mono text-[11px] text-zinc-400">
                              MP {tenant.mpSubscriptionStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <form action={updateTenantActive}>
                        <input type="hidden" name="tenantId" value={tenant.id} />
                        <input type="hidden" name="active" value={tenant.active ? "false" : "true"} />
                        <button
                          type="submit"
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                            tenant.active
                              ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          {tenant.active ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {tenants.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            No hay negocios que coincidan con esos filtros.
          </div>
        )}
      </section>
    </div>
  );
}

function PlatformDatabaseError() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
      <h1 className="text-lg font-semibold">No pudimos conectar con la base de datos</h1>
      <p className="mt-2 max-w-2xl text-sm text-amber-900/80 dark:text-amber-100/80">
        La plataforma esta disponible, pero Prisma no pudo leer los negocios. Revisa que la base
        de Railway este activa y que `DATABASE_URL` tenga el host y puerto actuales.
      </p>
      <Link
        href="/platform"
        className="mt-4 inline-flex rounded-md bg-amber-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-800 dark:bg-amber-100 dark:text-amber-950 dark:hover:bg-white"
      >
        Reintentar
      </Link>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
