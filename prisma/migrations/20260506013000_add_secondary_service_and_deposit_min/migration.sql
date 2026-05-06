ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "depositMinCents" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "category" TEXT;

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "secondaryServiceId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "secondaryServiceName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "secondaryServicePriceCents" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "secondaryServiceDurationMin" INTEGER;

CREATE INDEX IF NOT EXISTS "Appointment_secondaryServiceId_idx" ON "Appointment"("secondaryServiceId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Appointment_secondaryServiceId_fkey'
  ) THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_secondaryServiceId_fkey"
      FOREIGN KEY ("secondaryServiceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
