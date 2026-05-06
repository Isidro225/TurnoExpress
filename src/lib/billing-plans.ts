export const BILLING_PLAN_VALUES = ["basic", "pro", "premium"] as const;
export const BILLING_STATUS_VALUES = [
  "trialing",
  "pending",
  "active",
  "paused",
  "cancelled",
  "past_due",
] as const;

export type BillingPlanId = (typeof BILLING_PLAN_VALUES)[number];
export type BillingStatus = (typeof BILLING_STATUS_VALUES)[number];

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  tagline: string;
  priceCents: number;
};

export const BILLING_TRIAL_DAYS = 14;

export function createBillingTrialWindow(now = new Date()): {
  trialStartedAt: Date;
  trialEndsAt: Date;
} {
  const trialStartedAt = new Date(now);
  const trialEndsAt = new Date(now);
  trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + BILLING_TRIAL_DAYS);
  return { trialStartedAt, trialEndsAt };
}

export function isBillingTrialActive(
  trialEndsAt: Date | null | undefined,
  now = new Date()
): boolean {
  return !!trialEndsAt && trialEndsAt.getTime() > now.getTime();
}

export const BILLING_PLANS: Record<BillingPlanId, BillingPlan> = {
  basic: {
    id: "basic",
    name: "Básico",
    tagline: "Para empezar a tomar turnos sin invertir de más.",
    priceCents: 13_000_00,
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Para negocios establecidos con equipo y volumen.",
    priceCents: 25_000_00,
  },
  premium: {
    id: "premium",
    name: "Premium",
    tagline: "Para centros, cadenas y operaciones grandes.",
    priceCents: 45_000_00,
  },
};

export function normalizeBillingPlan(value: unknown): BillingPlanId {
  return BILLING_PLAN_VALUES.includes(value as BillingPlanId)
    ? (value as BillingPlanId)
    : "pro";
}

export function formatBillingPlanPrice(planId: BillingPlanId): string {
  return `$${(BILLING_PLANS[planId].priceCents / 100).toLocaleString("es-AR")}`;
}
