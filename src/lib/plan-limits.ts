import { endOfMonth, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  BILLING_PLANS,
  type BillingPlanId,
  normalizeBillingPlan,
} from "@/lib/billing-plans";
import { countedForPlanAppointmentWhere } from "./payment-holds";

export type PlanFeatureKey =
  | "branding"
  | "emailReminders"
  | "advancedStats"
  | "multiBranch"
  | "customDomain"
  | "apiAccess"
  | "prioritySupport";

export type PlanLimits = {
  maxStaff: number | null; // null = ilimitado
  maxAppointmentsPerMonth: number | null;
  features: Record<PlanFeatureKey, boolean>;
};

export const PLAN_LIMITS: Record<BillingPlanId, PlanLimits> = {
  basic: {
    maxStaff: 1,
    maxAppointmentsPerMonth: 50,
    features: {
      branding: false,
      emailReminders: false,
      advancedStats: false,
      multiBranch: false,
      customDomain: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  pro: {
    maxStaff: 5,
    maxAppointmentsPerMonth: null,
    features: {
      branding: true,
      emailReminders: true,
      advancedStats: true,
      multiBranch: false,
      customDomain: false,
      apiAccess: false,
      prioritySupport: true,
    },
  },
  premium: {
    maxStaff: null,
    maxAppointmentsPerMonth: null,
    features: {
      branding: true,
      emailReminders: true,
      advancedStats: true,
      multiBranch: true,
      customDomain: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
};

export const PLAN_FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  branding: "Branding completo (logo, color, fuente)",
  emailReminders: "Recordatorios por email",
  advancedStats: "Estadísticas y reportes",
  multiBranch: "Multi-sucursal",
  customDomain: "Dominio propio (tunegocio.com)",
  apiAccess: "API para integraciones",
  prioritySupport: "Soporte prioritario",
};

// ──────────────────────────────────────────────────────────────────────────────
// Errores
// ──────────────────────────────────────────────────────────────────────────────

export type PlanLimitKind = "staff" | "appointmentsPerMonth";

export class PlanLimitError extends Error {
  readonly kind: PlanLimitKind;
  readonly plan: BillingPlanId;
  readonly limit: number;
  readonly current: number;

  constructor(
    message: string,
    info: { kind: PlanLimitKind; plan: BillingPlanId; limit: number; current: number }
  ) {
    super(message);
    this.name = "PlanLimitError";
    this.kind = info.kind;
    this.plan = info.plan;
    this.limit = info.limit;
    this.current = info.current;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Lectura de plan + uso
// ──────────────────────────────────────────────────────────────────────────────

export type TenantPlanContext = {
  plan: BillingPlanId;
  planName: string;
  limits: PlanLimits;
};

export async function getTenantPlanContext(tenantId: string): Promise<TenantPlanContext> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { billingPlan: true },
  });
  const plan = normalizeBillingPlan(tenant?.billingPlan);
  return { plan, planName: BILLING_PLANS[plan].name, limits: PLAN_LIMITS[plan] };
}

export async function getStaffCount(tenantId: string): Promise<number> {
  return prisma.staff.count({ where: { tenantId } });
}

export async function getAppointmentsThisMonthCount(tenantId: string): Promise<number> {
  const now = new Date();
  return prisma.appointment.count({
    where: {
      tenantId,
      startsAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
      AND: [countedForPlanAppointmentWhere(now)],
    },
  });
}

export type TenantPlanUsage = TenantPlanContext & {
  staff: { used: number; limit: number | null; reached: boolean };
  appointmentsThisMonth: { used: number; limit: number | null; reached: boolean };
};

export async function getTenantPlanUsage(tenantId: string): Promise<TenantPlanUsage> {
  const ctx = await getTenantPlanContext(tenantId);
  const [staffUsed, apptUsed] = await Promise.all([
    getStaffCount(tenantId),
    getAppointmentsThisMonthCount(tenantId),
  ]);
  return {
    ...ctx,
    staff: {
      used: staffUsed,
      limit: ctx.limits.maxStaff,
      reached: ctx.limits.maxStaff != null && staffUsed >= ctx.limits.maxStaff,
    },
    appointmentsThisMonth: {
      used: apptUsed,
      limit: ctx.limits.maxAppointmentsPerMonth,
      reached:
        ctx.limits.maxAppointmentsPerMonth != null &&
        apptUsed >= ctx.limits.maxAppointmentsPerMonth,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Asserts
// ──────────────────────────────────────────────────────────────────────────────

export async function assertCanCreateStaff(tenantId: string): Promise<void> {
  const ctx = await getTenantPlanContext(tenantId);
  if (ctx.limits.maxStaff == null) return;
  const current = await getStaffCount(tenantId);
  if (current >= ctx.limits.maxStaff) {
    const plural = ctx.limits.maxStaff === 1 ? "" : "es";
    throw new PlanLimitError(
      `Tu plan ${ctx.planName} permite hasta ${ctx.limits.maxStaff} profesional${plural}. Subí de plan para sumar más.`,
      { kind: "staff", plan: ctx.plan, limit: ctx.limits.maxStaff, current }
    );
  }
}

export async function assertCanCreateAppointment(tenantId: string): Promise<void> {
  const ctx = await getTenantPlanContext(tenantId);
  if (ctx.limits.maxAppointmentsPerMonth == null) return;
  const current = await getAppointmentsThisMonthCount(tenantId);
  if (current >= ctx.limits.maxAppointmentsPerMonth) {
    throw new PlanLimitError(
      `Este negocio alcanzó el máximo de ${ctx.limits.maxAppointmentsPerMonth} turnos en el mes para su plan actual.`,
      {
        kind: "appointmentsPerMonth",
        plan: ctx.plan,
        limit: ctx.limits.maxAppointmentsPerMonth,
        current,
      }
    );
  }
}
