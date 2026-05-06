import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  updateSettings,
  disconnectMercadoPago,
  updateMpCredentials,
  verifyMpCredentials,
} from "./actions";
import { LogoUpload } from "./LogoUpload";
import { MercadoPagoForm } from "./MercadoPagoForm";
import { PageHeader } from "../_components/PageHeader";
import { ColorPicker } from "../_components/ColorPicker";
import { CheckIcon } from "../_components/AdminIcons";
import { PlanUsageBar } from "../_components/PlanUsage";
import {
  TENANT_TITLE_FONTS,
  TENANT_TITLE_FONT_VALUES,
  normalizeTenantTitleFont,
} from "@/lib/tenant-fonts";
import {
  PLAN_FEATURE_LABELS,
  type PlanFeatureKey,
  getTenantPlanUsage,
} from "@/lib/plan-limits";
import {
  BILLING_PLANS,
  formatBillingPlanPrice,
  isBillingTrialActive,
} from "@/lib/billing-plans";
import {
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPE_VALUES,
  normalizeBusinessType,
} from "@/lib/business-types";

const MP_BANNERS: Record<string, { tone: "ok" | "err"; text: string }> = {
  connected: { tone: "ok", text: "Mercado Pago conectado correctamente." },
  saved: { tone: "ok", text: "Credenciales de Mercado Pago guardadas." },
  verified: { tone: "ok", text: "Conexión verificada con Mercado Pago." },
  disconnected: { tone: "ok", text: "Mercado Pago desconectado." },
  error: { tone: "err", text: "Mercado Pago canceló la conexión." },
  "missing-code": { tone: "err", text: "Faltan datos en la respuesta de Mercado Pago." },
  "invalid-state": { tone: "err", text: "El estado de OAuth no es válido (probá de nuevo)." },
  "server-misconfigured": { tone: "err", text: "OAuth de MP no está configurado en el servidor." },
  "exchange-failed": { tone: "err", text: "No pudimos canjear el código con Mercado Pago." },
  "bad-format": { tone: "err", text: "Formato de credenciales inválido. Revisá el access token." },
  "no-token": { tone: "err", text: "Todavía no cargaste credenciales." },
  "verify-failed": {
    tone: "err",
    text: "Mercado Pago rechazó el token. Probá generarlo de nuevo.",
  },
};

function maskToken(token: string): string {
  if (token.length <= 8) return "•••";
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

function formatTrialDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ mp?: string }>;
}) {
  const session = await auth();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session!.user.tenantId! },
  });
  if (!tenant) return null;

  const oauthConfigured = !!process.env.MP_OAUTH_CLIENT_ID;
  const sp = await searchParams;
  const banner = sp.mp ? MP_BANNERS[sp.mp] : undefined;
  const isConnected = !!tenant.mpAccessToken;
  const tenantTitleFont = normalizeTenantTitleFont(
    (tenant as { titleFont?: string | null }).titleFont
  );
  const businessType = normalizeBusinessType(tenant.businessType) ?? "";
  const planUsage = await getTenantPlanUsage(tenant.id);
  const trialActive = isBillingTrialActive(tenant.trialEndsAt);
  const trialExpired = !!tenant.trialEndsAt && !trialActive && tenant.billingStatus === "trialing";
  const billingStatusLabel = trialActive
    ? `prueba gratis hasta ${formatTrialDate(tenant.trialEndsAt!)}`
    : trialExpired
      ? "prueba expirada"
      : tenant.billingStatus;

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Configuración"
        description="Personalizá tu turnera y conectá tu cuenta de Mercado Pago."
      />

      {banner && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            banner.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              banner.tone === "ok" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {banner.tone === "ok" ? (
              <CheckIcon className="h-3 w-3" />
            ) : (
              <span className="text-xs font-bold">!</span>
            )}
          </span>
          <p>{banner.text}</p>
        </div>
      )}

      {/* Tu plan TurnoExpress */}
      <section
        id="plan"
        className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
              <SparkleIcon />
            </span>
            <div>
              <h2 className="text-base font-semibold">Tu plan TurnoExpress</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                El abono mensual que pagás a la plataforma. Define tus límites y features.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Plan actual
              </p>
              <p className="mt-1 text-2xl font-semibold">{planUsage.planName}</p>
              <p className="text-sm text-zinc-500">
                {BILLING_PLANS[planUsage.plan].tagline}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold tracking-tight">
                {formatBillingPlanPrice(planUsage.plan)}
              </p>
              <p className="text-xs text-zinc-500">por mes</p>
            </div>
          </div>

          {trialActive && tenant.trialEndsAt && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              <p className="font-semibold">Prueba gratis activa</p>
              <p className="mt-1 text-emerald-800 dark:text-emerald-300">
                Tu primer cobro está programado para después del{" "}
                <span className="font-semibold">{formatTrialDate(tenant.trialEndsAt)}</span>.
              </p>
            </div>
          )}

          {trialExpired && tenant.trialEndsAt && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">Prueba expirada</p>
              <p className="mt-1 text-amber-800 dark:text-amber-300">
                La prueba terminó el{" "}
                <span className="font-semibold">{formatTrialDate(tenant.trialEndsAt)}</span>.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <PlanUsageBar
                label="Profesionales"
                used={planUsage.staff.used}
                limit={planUsage.staff.limit}
              />
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <PlanUsageBar
                label="Turnos este mes"
                used={planUsage.appointmentsThisMonth.used}
                limit={planUsage.appointmentsThisMonth.limit}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Features del plan
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(PLAN_FEATURE_LABELS) as PlanFeatureKey[]).map((key) => {
                const enabled = planUsage.limits.features[key];
                return (
                  <li
                    key={key}
                    className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                      enabled
                        ? "border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                        : "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                        enabled
                          ? "bg-emerald-500 text-white"
                          : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800"
                      }`}
                    >
                      {enabled ? (
                        <CheckIcon className="h-2.5 w-2.5" />
                      ) : (
                        <span className="block h-px w-1.5 bg-current" />
                      )}
                    </span>
                    <span>{PLAN_FEATURE_LABELS[key]}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {planUsage.plan !== "premium" && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm dark:border-sky-900/60 dark:bg-sky-950/30">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white">
                  <SparkleIcon className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-sky-900 dark:text-sky-200">
                    Necesitás más?{" "}
                    {planUsage.plan === "basic"
                      ? `Con Pro (${formatBillingPlanPrice("pro")}/mes) sumás hasta 5 profesionales y turnos ilimitados.`
                      : `Premium (${formatBillingPlanPrice("premium")}/mes) te da profesionales ilimitados, multi-sucursal y dominio propio.`}
                  </p>
                  <Link
                    href="/#planes"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 underline dark:text-sky-300"
                  >
                    Ver todos los planes →
                  </Link>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-zinc-500">
            Estado de facturación:{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {billingStatusLabel}
            </span>
            {tenant.mpSubscriptionStatus && (
              <>
                {" "}· MP: <span className="font-mono">{tenant.mpSubscriptionStatus}</span>
              </>
            )}
          </p>
        </div>
      </section>

      {/* Datos del negocio */}
      <Section
        title="Datos del negocio"
        description="Aparecen en la página pública donde tus clientes reservan."
      >
        <form action={updateSettings} className="space-y-5">
          <Field label="Nombre del negocio">
            <input
              name="name"
              required
              defaultValue={tenant.name}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </Field>
          <Field label="Tipo de negocio">
            <select
              name="businessType"
              defaultValue={businessType}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Sin definir</option>
              {BUSINESS_TYPE_VALUES.map((type) => (
                <option key={type} value={type}>
                  {BUSINESS_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Descripción" hint="Una línea corta que aparece debajo del nombre.">
            <textarea
              name="description"
              rows={2}
              defaultValue={tenant.description ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </Field>
          <Field label="Logo">
            <LogoUpload defaultValue={tenant.logoUrl} />
          </Field>
          <Field label="Color principal" hint="Acento que se aplica a botones y chips de tu turnera.">
            <ColorPicker name="primaryColor" defaultValue={tenant.primaryColor} />
          </Field>
          <Field
            label="Fuente del título"
            hint="Se aplica al nombre del negocio en la página pública."
          >
            <select
              name="titleFont"
              defaultValue={tenantTitleFont}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {TENANT_TITLE_FONT_VALUES.map((font) => (
                <option key={font} value={font}>
                  {TENANT_TITLE_FONTS[font].label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="% de seña por defecto"
            hint="Podés sobrescribirlo por servicio."
          >
            <div className="relative w-32">
              <input
                name="depositPct"
                type="number"
                min={0}
                max={100}
                defaultValue={tenant.depositPct}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-7 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                %
              </span>
            </div>
          </Field>
          <Field
            label="Seña mínima (ARS)"
            hint="Si el porcentaje da menos que este monto, se cobra este. Dejalo en 0 para no aplicar mínimo."
          >
            <div className="relative w-40">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                $
              </span>
              <input
                name="depositMinArs"
                type="number"
                min={0}
                step="1"
                defaultValue={Math.round(tenant.depositMinCents / 100)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pl-7 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </Field>

          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              URL pública
            </p>
            <p className="mt-1 font-mono text-sm">turnoexpress.com/{tenant.slug}</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-500/25 transition hover:shadow-md hover:shadow-sky-500/40"
            >
              <CheckIcon className="h-4 w-4" />
              Guardar cambios
            </button>
          </div>
        </form>
      </Section>

      {/* Mercado Pago */}
      <Section
        title="Mercado Pago"
        description="Cada negocio cobra a su propia cuenta. La seña va directo a tu MP, sin pasar por nosotros."
        icon={<MpIcon />}
      >
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckIcon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="font-medium text-emerald-900 dark:text-emerald-200">
                  Cuenta conectada
                </p>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  Token: <span className="font-mono">{maskToken(tenant.mpAccessToken!)}</span>
                  {tenant.mpAccessToken!.startsWith("TEST-") && (
                    <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Sandbox
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                  {tenant.mpPublicKey ? "Public key configurada" : "Sin public key"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={verifyMpCredentials}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Probar conexión
                </button>
              </form>
              <form action={disconnectMercadoPago}>
                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Desconectar
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {oauthConfigured ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- navega a un route handler que redirige a Mercado Pago */}
                <a
                  href="/api/mercadopago/oauth/connect"
                  className="inline-flex items-center gap-2 rounded-md bg-[#009ee3] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0086c4]"
                >
                  <MpIcon className="h-4 w-4" />
                  Conectar con Mercado Pago
                </a>
                <p className="mt-2 text-xs text-zinc-500">
                  Te lleva al login de Mercado Pago y volvés acá automáticamente.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                OAuth no está habilitado en el servidor. Configurá{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">MP_OAUTH_CLIENT_ID</code> y{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">MP_OAUTH_CLIENT_SECRET</code>{" "}
                para habilitarlo, o usá la entrada manual de abajo.
              </div>
            )}
          </div>
        )}

        <details
          className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800"
          open={!isConnected}
        >
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
            {isConnected ? "Reemplazar credenciales manualmente" : "Conectar manualmente"}
          </summary>
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
            <MercadoPagoForm
              action={updateMpCredentials}
              hasPublicKey={!!tenant.mpPublicKey}
            />
          </div>
        </details>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-emerald-100 text-sky-600 dark:from-sky-950/60 dark:to-emerald-950/60 dark:text-sky-300">
              {icon}
            </span>
          )}
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function SparkleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.5l1.6 5.4L19 9.5l-5.4 1.6L12 16.5l-1.6-5.4L5 9.5l5.4-1.6z" />
      <path d="M19 14l.6 1.9 1.9.6-1.9.6L19 19l-.6-1.9-1.9-.6 1.9-.6z" />
    </svg>
  );
}

function MpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 8.5C3 6.5 5 5 7.5 5h9C19 5 21 6.5 21 8.5v7c0 2-2 3.5-4.5 3.5h-9C5 19 3 17.5 3 15.5v-7zm10.5 6c2.2 0 4-1.5 4-3.5s-1.8-3.5-4-3.5-4 1.5-4 3.5 1.8 3.5 4 3.5z" />
    </svg>
  );
}
