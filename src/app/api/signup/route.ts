import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isReservedSlug, normalizeSlug } from "@/lib/tenant";
import {
  BILLING_PLANS,
  BILLING_PLAN_VALUES,
  normalizeBillingPlan,
} from "@/lib/billing-plans";
import { createPlatformSubscription } from "@/lib/mercadopago";

const signupSchema = z.object({
  businessName: z.string().min(2).max(80),
  slug: z.string().min(2).max(40),
  email: z.string().email(),
  password: z.string().min(8),
  ownerName: z.string().min(1).max(80),
  billingPlan: z.enum(BILLING_PLAN_VALUES).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const slug = normalizeSlug(parsed.data.slug);
  if (!slug || isReservedSlug(slug)) {
    return NextResponse.json({ error: "Ese slug no está disponible" }, { status: 400 });
  }

  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    return NextResponse.json({ error: "Ese slug ya está en uso" }, { status: 409 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const billingPlanId = normalizeBillingPlan(parsed.data.billingPlan);
  const billingPlan = BILLING_PLANS[billingPlanId];

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name: parsed.data.businessName,
      billingPlan: billingPlanId,
      billingStatus: "pending",
      users: {
        create: {
          email: parsed.data.email,
          name: parsed.data.ownerName,
          passwordHash,
          role: "OWNER",
        },
      },
    },
    include: { users: true },
  });

  const platformAccessToken = process.env.MP_PLATFORM_ACCESS_TOKEN?.trim();
  if (!platformAccessToken) {
    return NextResponse.json({
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      billingConfigured: false,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;

  let subscription: Awaited<ReturnType<typeof createPlatformSubscription>>;
  try {
    subscription = await createPlatformSubscription({
      accessToken: platformAccessToken,
      tenantId: tenant.id,
      planName: billingPlan.name,
      amountCents: billingPlan.priceCents,
      payerEmail: parsed.data.email,
      baseUrl,
    });
  } catch (err) {
    await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => null);
    return NextResponse.json(
      {
        error: "No pudimos iniciar la contrataciÃ³n con Mercado Pago.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      billingStatus: "pending",
      mpSubscriptionId: subscription.id ?? null,
      mpSubscriptionStatus: subscription.status ?? "pending",
    },
  });

  return NextResponse.json({
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
    billingConfigured: true,
    billingRedirectUrl: subscription.init_point ?? null,
  });
}
