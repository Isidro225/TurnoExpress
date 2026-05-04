ALTER TABLE "Tenant" ADD COLUMN "billingPlan" TEXT NOT NULL DEFAULT 'pro';
ALTER TABLE "Tenant" ADD COLUMN "billingStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Tenant" ADD COLUMN "mpSubscriptionId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "mpSubscriptionStatus" TEXT;

CREATE UNIQUE INDEX "Tenant_mpSubscriptionId_key" ON "Tenant"("mpSubscriptionId");
