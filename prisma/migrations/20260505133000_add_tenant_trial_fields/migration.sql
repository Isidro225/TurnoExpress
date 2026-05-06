ALTER TABLE "Tenant" ADD COLUMN "trialStartedAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "trialEndsAt" TIMESTAMP(3);

CREATE INDEX "Tenant_trialEndsAt_idx" ON "Tenant"("trialEndsAt");
