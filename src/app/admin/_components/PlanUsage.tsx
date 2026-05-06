import Link from "next/link";
import type { TenantPlanUsage } from "@/lib/plan-limits";

type Tone = "neutral" | "warn" | "danger";

function toneFor(used: number, limit: number | null): Tone {
  if (limit == null) return "neutral";
  const ratio = used / limit;
  if (ratio >= 1) return "danger";
  if (ratio >= 0.8) return "warn";
  return "neutral";
}

const TONES: Record<Tone, { bar: string; track: string; label: string }> = {
  neutral: {
    bar: "bg-gradient-to-r from-sky-500 to-emerald-500",
    track: "bg-zinc-100 dark:bg-zinc-800",
    label: "text-zinc-500",
  },
  warn: {
    bar: "bg-amber-500",
    track: "bg-amber-100 dark:bg-amber-950/40",
    label: "text-amber-700 dark:text-amber-400",
  },
  danger: {
    bar: "bg-red-500",
    track: "bg-red-100 dark:bg-red-950/40",
    label: "text-red-700 dark:text-red-400",
  },
};

export function PlanUsageBar({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number | null;
  unit?: string;
}) {
  const tone = toneFor(used, limit);
  const t = TONES[tone];
  const pct = limit == null ? 0 : Math.min(100, (used / limit) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className={t.label}>
          {limit == null ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {used} · ilimitado
            </span>
          ) : (
            <>
              <span className="font-semibold">{used}</span>
              <span className="text-zinc-400"> / {limit}</span>
              {unit && <span className="ml-1 text-zinc-400">{unit}</span>}
            </>
          )}
        </span>
      </div>
      {limit != null && (
        <div className={`mt-1.5 h-1.5 w-full overflow-hidden rounded-full ${t.track}`}>
          <div
            className={`h-full rounded-full transition-all ${t.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function PlanLimitNotice({
  title,
  description,
  planName,
}: {
  title: string;
  description: string;
  planName: string;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          <LockIcon className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-amber-900 dark:text-amber-200">{title}</p>
          <p className="mt-1 text-amber-800 dark:text-amber-300">{description}</p>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            Plan actual: <span className="font-semibold">{planName}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/admin/settings#plan"
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              Subir de plan
            </Link>
            <Link
              href="/admin/settings#plan"
              className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/60"
            >
              Ver mi plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PlanUsageAlerts — banners para mostrar en el dashboard cuando el uso ≥ 80%
// ──────────────────────────────────────────────────────────────────────────────

type AlertSpec = {
  key: string;
  level: "warn" | "danger";
  title: string;
  body: string;
};

function buildAlerts(usage: TenantPlanUsage): AlertSpec[] {
  const out: AlertSpec[] = [];

  if (usage.staff.limit != null) {
    const ratio = usage.staff.used / usage.staff.limit;
    if (ratio >= 1) {
      out.push({
        key: "staff-full",
        level: "danger",
        title: "Llegaste al límite de profesionales de tu plan",
        body: `Tenés ${usage.staff.used} de ${usage.staff.limit} en el plan ${usage.planName}. Para sumar más, subí de plan.`,
      });
    } else if (ratio >= 0.8) {
      const left = usage.staff.limit - usage.staff.used;
      out.push({
        key: "staff-near",
        level: "warn",
        title: "Estás cerca del límite de profesionales",
        body: `Te ${left === 1 ? "queda 1 lugar" : `quedan ${left} lugares`} en el plan ${usage.planName}.`,
      });
    }
  }

  if (usage.appointmentsThisMonth.limit != null) {
    const ratio = usage.appointmentsThisMonth.used / usage.appointmentsThisMonth.limit;
    if (ratio >= 1) {
      out.push({
        key: "appts-full",
        level: "danger",
        title: "Llegaste al límite de turnos del mes",
        body: `Tu plan ${usage.planName} permite ${usage.appointmentsThisMonth.limit} turnos por mes. Hasta el mes que viene no podés tomar más reservas.`,
      });
    } else if (ratio >= 0.8) {
      const left = usage.appointmentsThisMonth.limit - usage.appointmentsThisMonth.used;
      out.push({
        key: "appts-near",
        level: "warn",
        title: "Te estás acercando al máximo de turnos del mes",
        body: `Te ${left === 1 ? "queda 1 turno disponible" : `quedan ${left} turnos disponibles`} en el plan ${usage.planName} este mes.`,
      });
    }
  }

  return out;
}

const ALERT_STYLES = {
  warn: {
    container:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
    badge: "bg-amber-500 text-white",
    cta: "bg-amber-500 hover:bg-amber-600 text-white",
    secondary:
      "border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/60",
    note: "text-amber-700 dark:text-amber-400",
  },
  danger: {
    container:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200",
    badge: "bg-red-500 text-white",
    cta: "bg-red-500 hover:bg-red-600 text-white",
    secondary:
      "border-red-300 text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/60",
    note: "text-red-700 dark:text-red-400",
  },
} as const;

export function PlanUsageAlerts({ usage }: { usage: TenantPlanUsage }) {
  const alerts = buildAlerts(usage);
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((a) => {
        const styles = ALERT_STYLES[a.level];
        return (
          <div
            key={a.key}
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${styles.container}`}
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${styles.badge}`}
            >
              {a.level === "danger" ? (
                <LockIcon className="h-4 w-4" />
              ) : (
                <BellIcon className="h-4 w-4" />
              )}
            </span>
            <div className="flex-1">
              <p className="font-semibold">{a.title}</p>
              <p className={`mt-0.5 ${styles.note}`}>{a.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/admin/settings#plan"
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition ${styles.cta}`}
                >
                  Subir de plan
                </Link>
                <Link
                  href="/admin/settings#plan"
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${styles.secondary}`}
                >
                  Ver mi plan
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BellIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
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
