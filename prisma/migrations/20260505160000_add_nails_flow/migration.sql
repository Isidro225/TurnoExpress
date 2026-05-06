-- Service: minutos extra cuando el cliente elige "con diseño" (solo nails).
ALTER TABLE "Service" ADD COLUMN "designMin" INTEGER;

-- Appointment: snapshots del flujo de uñas (nulos para otros tipos).
ALTER TABLE "Appointment" ADD COLUMN "priorServiceName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "priorAge" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "procedureMode" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "withDesign" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN "extraMinutes" INTEGER NOT NULL DEFAULT 0;

-- PriorService: lista aparte de servicios que un cliente puede declarar tener hechos.
CREATE TABLE "PriorService" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "removalMin" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorService_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PriorService_tenantId_idx" ON "PriorService"("tenantId");

ALTER TABLE "PriorService"
    ADD CONSTRAINT "PriorService_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
