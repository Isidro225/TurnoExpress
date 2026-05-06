"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertPlatformAdmin } from "@/lib/platform-admin";
import {
  BILLING_PLANS,
  BILLING_PLAN_VALUES,
  BILLING_STATUS_VALUES,
  normalizeBillingPlan,
} from "@/lib/billing-plans";
import { updatePlatformSubscription } from "@/lib/mercadopago";

const tenantIdSchema = z.string().min(1);

const billingSchema = z.object({
  tenantId: tenantIdSchema,
  billingPlan: z.enum(BILLING_PLAN_VALUES),
  billingStatus: z.string().min(1).max(40),
  returnTo: z.string().optional(),
});

const activeSchema = z.object({
  tenantId: tenantIdSchema,
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

function platformReturnTo(value: string | undefined, params: Record<string, string> = {}) {
  const base = value?.startsWith("/platform") ? value : "/platform";
  const [pathname, query = ""] = base.split("?");
  const searchParams = new URLSearchParams(query);
  for (const [key, val] of Object.entries(params)) {
    searchParams.set(key, val);
  }
  const qs = searchParams.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export async function updateTenantBilling(formData: FormData) {
  await assertPlatformAdmin();

  const data = billingSchema.parse({
    tenantId: formData.get("tenantId"),
    billingPlan: formData.get("billingPlan"),
    billingStatus: formData.get("billingStatus"),
    returnTo: formData.get("returnTo") || undefined,
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: data.tenantId },
    select: { billingPlan: true, billingStatus: true, mpSubscriptionId: true },
  });
  if (!tenant) {
    redirect(platformReturnTo(data.returnTo, { billing: "not-found" }));
  }

  if (
    !BILLING_STATUS_VALUES.includes(data.billingStatus as (typeof BILLING_STATUS_VALUES)[number]) &&
    data.billingStatus !== tenant.billingStatus
  ) {
    redirect(platformReturnTo(data.returnTo, { billing: "invalid" }));
  }

  let mpSync = "skipped";
  const previousPlan = normalizeBillingPlan(tenant.billingPlan);
  const planChanged = previousPlan !== data.billingPlan;
  const platformAccessToken = process.env.MP_PLATFORM_ACCESS_TOKEN?.trim();

  if (planChanged && tenant.mpSubscriptionId && platformAccessToken) {
    const plan = BILLING_PLANS[data.billingPlan];
    try {
      await updatePlatformSubscription({
        accessToken: platformAccessToken,
        subscriptionId: tenant.mpSubscriptionId,
        planName: plan.name,
        amountCents: plan.priceCents,
      });
      mpSync = "ok";
    } catch {
      mpSync = "failed";
    }
  }

  await prisma.tenant.update({
    where: { id: data.tenantId },
    data: {
      billingPlan: data.billingPlan,
      billingStatus: data.billingStatus,
    },
  });

  revalidatePath("/platform");
  redirect(platformReturnTo(data.returnTo, { billing: "saved", mpSync }));
}

export async function updateTenantActive(formData: FormData) {
  await assertPlatformAdmin();

  const data = activeSchema.parse({
    tenantId: formData.get("tenantId"),
    active: formData.get("active"),
  });

  await prisma.tenant.update({
    where: { id: data.tenantId },
    data: { active: data.active },
  });

  revalidatePath("/platform");
}
