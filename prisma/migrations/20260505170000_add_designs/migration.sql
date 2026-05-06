-- Service: ya no se usa designMin (cada diseño tiene su propio tiempo).
ALTER TABLE "Service" DROP COLUMN "designMin";

-- Appointment: el toggle booleano se reemplaza por un FK + snapshots del diseño.
ALTER TABLE "Appointment" DROP COLUMN "withDesign";
ALTER TABLE "Appointment" ADD COLUMN "designId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "designName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "designPriceCents" INTEGER;

-- Design: catálogo de diseños por tenant (solo nails).
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Design_tenantId_idx" ON "Design"("tenantId");

ALTER TABLE "Design"
    ADD CONSTRAINT "Design_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_designId_fkey"
    FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;
