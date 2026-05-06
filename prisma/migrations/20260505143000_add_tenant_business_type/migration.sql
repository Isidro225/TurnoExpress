ALTER TABLE "Tenant" ADD COLUMN "businessType" TEXT;

CREATE INDEX "Tenant_businessType_idx" ON "Tenant"("businessType");
