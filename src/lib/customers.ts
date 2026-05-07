import { prisma } from "@/lib/prisma";

/**
 * Normaliza un teléfono dejando sólo dígitos. Es la clave para agrupar turnos
 * en un único Customer dentro del tenant. La misma lógica corre en SQL en el
 * backfill (regexp_replace '[^0-9]'). MVP intencional: no convertimos a E.164;
 * "+54 11 1234 5678" y "11 1234 5678" siguen siendo dos clientes distintos.
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}

type FindOrCreateInput = {
  tenantId: string;
  rawPhone: string | null | undefined;
  name: string;
  email?: string | null;
};

/**
 * Busca o crea un Customer matcheando por (tenantId, teléfono normalizado).
 * Si el teléfono normaliza a vacío devuelve null (no se puede agrupar).
 * Si ya existe, actualiza name/email con los datos más recientes (last write wins).
 */
export async function findOrCreateCustomer({
  tenantId,
  rawPhone,
  name,
  email,
}: FindOrCreateInput): Promise<{ id: string } | null> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return null;

  return prisma.customer.upsert({
    where: { tenantId_phone: { tenantId, phone } },
    create: {
      tenantId,
      phone,
      name,
      email: email ?? null,
    },
    update: {
      name,
      email: email ?? null,
    },
    select: { id: true },
  });
}
