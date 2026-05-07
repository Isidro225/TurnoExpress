-- Customer table: agrupa turnos por (tenantId, teléfono normalizado).
CREATE TABLE IF NOT EXISTS "Customer" (
  "id"        TEXT PRIMARY KEY,
  "tenantId"  TEXT NOT NULL,
  "phone"     TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "email"     TEXT,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Customer_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_tenantId_phone_key" ON "Customer"("tenantId", "phone");
CREATE INDEX IF NOT EXISTS "Customer_tenantId_idx" ON "Customer"("tenantId");

-- Appointment.customerId
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
CREATE INDEX IF NOT EXISTS "Appointment_customerId_idx" ON "Appointment"("customerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_customerId_fkey'
  ) THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill: por cada (tenantId, teléfono normalizado) creamos un Customer con
-- el name/email del turno más reciente, y lincamos todos los turnos del grupo.
WITH normalized AS (
  SELECT
    a."id"            AS appt_id,
    a."tenantId"      AS tenant_id,
    a."customerName"  AS name,
    a."customerEmail" AS email,
    regexp_replace(COALESCE(a."customerPhone", ''), '[^0-9]', '', 'g') AS norm_phone,
    a."createdAt"     AS created_at
  FROM "Appointment" a
  WHERE a."customerPhone" IS NOT NULL
    AND length(regexp_replace(a."customerPhone", '[^0-9]', '', 'g')) > 0
),
latest_per_group AS (
  SELECT DISTINCT ON (tenant_id, norm_phone)
    tenant_id,
    norm_phone,
    name,
    email
  FROM normalized
  ORDER BY tenant_id, norm_phone, created_at DESC
),
inserted AS (
  INSERT INTO "Customer" ("id", "tenantId", "phone", "name", "email", "createdAt", "updatedAt")
  SELECT
    'c' || replace(gen_random_uuid()::text, '-', ''),
    tenant_id,
    norm_phone,
    name,
    email,
    NOW(),
    NOW()
  FROM latest_per_group
  ON CONFLICT ("tenantId", "phone") DO NOTHING
  RETURNING "id", "tenantId", "phone"
)
UPDATE "Appointment" appt
SET "customerId" = ins."id"
FROM inserted ins, normalized n
WHERE appt."id" = n.appt_id
  AND ins."tenantId" = n.tenant_id
  AND ins."phone"    = n.norm_phone;
