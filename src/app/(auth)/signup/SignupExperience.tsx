"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BILLING_TRIAL_DAYS,
  BILLING_PLANS,
  BILLING_PLAN_VALUES,
  type BillingPlanId,
  formatBillingPlanPrice,
  normalizeBillingPlan,
} from "@/lib/billing-plans";
import { BUSINESS_TYPE_LABELS, BUSINESS_TYPE_VALUES } from "@/lib/business-types";

const PLAN_FEATURES: Record<BillingPlanId, string[]> = {
  basic: [
    "1 profesional",
    "Hasta 50 turnos por mes",
    "URL personalizada",
    "Mercado Pago integrado",
    "Soporte por email",
  ],
  pro: [
    "Hasta 5 profesionales",
    "Turnos ilimitados",
    "Logo, color y branding completo",
    "Estadísticas y reportes",
    "Recordatorios por email",
    "Soporte prioritario",
  ],
  premium: [
    "Profesionales ilimitados",
    "Multi-sucursal",
    "Dominio propio (tunegocio.com)",
    "Onboarding 1 a 1",
    "API para integraciones",
    "Soporte dedicado",
  ],
};

const NEXT_STEPS = [
  {
    n: 1,
    title: "Cargás tus servicios y horarios",
    body: "Tu equipo, los servicios, el horario semanal. El sistema arma la disponibilidad solo.",
  },
  {
    n: 2,
    title: "Conectás Mercado Pago",
    body: "Vinculás tu cuenta en un click. Las señas van directo a tu MP, sin comisión nuestra.",
  },
  {
    n: 3,
    title: "Compartís tu link",
    body: "Tus clientes reservan, pagan la seña, y vos los ves aparecer en tu calendario.",
  },
];

export function SignupExperience({ initialPlan }: { initialPlan: BillingPlanId }) {
  const router = useRouter();
  const [billingPlan, setBillingPlan] = useState<BillingPlanId>(initialPlan);
  const [form, setForm] = useState({
    businessName: "",
    slug: "",
    businessType: "",
    ownerName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("plan") !== billingPlan) {
      url.searchParams.set("plan", billingPlan);
      window.history.replaceState(null, "", url.toString());
    }
  }, [billingPlan]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, billingPlan }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No pudimos crear tu cuenta");
      setLoading(false);
      return;
    }
    const login = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      setError("Cuenta creada pero falló el login. Probá iniciar sesión.");
      return;
    }
    if (data.billingRedirectUrl) {
      window.location.assign(data.billingRedirectUrl);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  const selectedPlan = BILLING_PLANS[billingPlan];
  const slugPreview = useMemo(() => form.slug.trim().toLowerCase() || "mi-negocio", [form.slug]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 pt-8 sm:gap-8 sm:px-6 sm:pb-20 sm:pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pt-14">
      {/* ── Form column ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="mb-6">
          <p className="mb-2 inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            Paso 1 de 2 · Tu cuenta
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Crear mi turnera
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Tu negocio va a estar online en minutos. Después activás tu plan con Mercado Pago.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Selector de plan */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900/60 dark:bg-sky-950/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                  Plan elegido
                </p>
                <p className="mt-1 font-semibold text-zinc-950 dark:text-zinc-50">
                  {selectedPlan.name}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {selectedPlan.tagline}
                </p>
              </div>
              <p className="shrink-0 text-right font-semibold text-sky-700 dark:text-sky-300">
                {formatBillingPlanPrice(billingPlan)}
                <span className="block text-[10px] font-normal text-zinc-500">/mes</span>
                <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {BILLING_TRIAL_DAYS} días gratis
                </span>
              </p>
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Cambiar plan</span>
              <select
                value={billingPlan}
                onChange={(e) => setBillingPlan(normalizeBillingPlan(e.target.value))}
                className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-sky-900/60 dark:bg-zinc-950"
              >
                {BILLING_PLAN_VALUES.map((plan) => (
                  <option key={plan} value={plan}>
                    {BILLING_PLANS[plan].name} · {formatBillingPlanPrice(plan)}/mes
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del negocio">
              <input
                required
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                placeholder="Peluquería Juan"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
            <Field label="Tipo de negocio">
              <select
                required
                value={form.businessType}
                onChange={(e) => update("businessType", e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">Elegir rubro</option>
                {BUSINESS_TYPE_VALUES.map((type) => (
                  <option key={type} value={type}>
                    {BUSINESS_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Tu nombre">
            <input
              required
              value={form.ownerName}
              onChange={(e) => update("ownerName", e.target.value)}
              placeholder="Juan Pérez"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </Field>

          <Field label="URL personalizada" hint="Solo letras, números y guiones.">
            <div className="flex items-center rounded-md border border-zinc-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 dark:border-zinc-700">
              <span className="shrink-0 whitespace-nowrap pl-3 pr-0.5 text-xs text-zinc-500 sm:pr-1 sm:text-sm">
                turnoexpress.com/
              </span>
              <input
                required
                value={form.slug}
                onChange={(e) => update("slug", e.target.value.toLowerCase())}
                placeholder="mi-negocio"
                className="w-full min-w-0 flex-1 rounded-r-md bg-transparent px-1 py-2 text-sm focus:outline-none sm:px-2 dark:bg-zinc-800"
              />
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="vos@email.com"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
            <Field label="Contraseña" hint="Mínimo 8 caracteres.">
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-md bg-gradient-to-r from-sky-500 to-emerald-500 py-2.5 text-sm font-medium text-white shadow-md shadow-sky-500/25 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/40 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <span className="relative z-10">
              {loading ? "Creando cuenta..." : `Iniciar ${BILLING_TRIAL_DAYS} días gratis`}
            </span>
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>

          <p className="text-center text-xs text-zinc-500">
            Al crear tu cuenta aceptás los términos. El primer cobro empieza después de la prueba.
          </p>
        </form>
      </div>

      {/* ── Side panel ──────────────────────────────────────────── */}
      <aside className="space-y-5">
        {/* Vista previa de URL */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-100 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[11px] text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              <LockIcon className="h-3 w-3 text-emerald-500" />
              <span className="truncate font-mono">turnoexpress.com/{slugPreview}</span>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Así va a quedar tu link
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Compartilo en tu bio, tus historias o tu firma de WhatsApp. Tus clientes reservan
              en segundos sin instalar nada.
            </p>
          </div>
        </div>

        {/* Detalle del plan */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Tu plan
              </p>
              <p className="text-lg font-semibold">{selectedPlan.name}</p>
            </div>
            <p className="text-right">
              <span className="text-2xl font-semibold tracking-tight">
                {formatBillingPlanPrice(billingPlan)}
              </span>
              <span className="block text-[11px] text-zinc-500">por mes</span>
              <span className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {BILLING_TRIAL_DAYS} días gratis
              </span>
            </p>
          </div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Incluye
          </p>
          <ul className="space-y-2 text-sm">
            {PLAN_FEATURES[billingPlan].map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Qué sigue */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Después de crear tu cuenta
          </p>
          <ol className="space-y-4">
            {NEXT_STEPS.map((step) => (
              <li key={step.n} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-white shadow-sm shadow-sky-500/30">
                  {step.n}
                </span>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-zinc-500">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Trust icon={<ShieldIcon />} title="Sin permanencia" body="Cancelás cuando quieras." />
          <Trust icon={<CoinIcon />} title="0% comisión" body="La seña va directo a tu MP." />
          <Trust icon={<LockIcon />} title="Datos seguros" body="Conexión cifrada SSL." />
          <Trust icon={<ChatIcon />} title="Soporte real" body="Te respondemos personas." />
        </div>
      </aside>
    </div>
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
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-zinc-500">{hint}</span>}
    </label>
  );
}

function Trust({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
        {icon}
      </div>
      <p className="text-sm font-semibold leading-tight">{title}</p>
      <p className="text-zinc-500">{body}</p>
    </div>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" strokeLinejoin="round" />
    </svg>
  );
}
function CoinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9h-3.5a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H10" strokeLinecap="round" />
      <path d="M12 7v1.5M12 15.5V17" strokeLinecap="round" />
    </svg>
  );
}
function ChatIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 12a8 8 0 0 1-11.6 7.2L4 20l1-4.5A8 8 0 1 1 21 12z" strokeLinejoin="round" />
    </svg>
  );
}
