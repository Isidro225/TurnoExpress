"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const serviceSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  durationMin: z.coerce.number().int().min(5).max(8 * 60),
  priceArs: z.coerce.number().min(0),
  depositPct: z.coerce.number().int().min(0).max(100).optional().nullable(),
  active: z.coerce.boolean().optional(),
});

async function requireTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");
  return session.user.tenantId;
}

function parseFormData(form: FormData) {
  const raw = {
    name: form.get("name"),
    description: form.get("description") || null,
    durationMin: form.get("durationMin"),
    priceArs: form.get("priceArs"),
    depositPct: form.get("depositPct") ? form.get("depositPct") : null,
    active: form.get("active") === "on" || form.get("active") === "true",
  };
  return serviceSchema.parse(raw);
}

export async function createService(formData: FormData) {
  const tenantId = await requireTenantId();
  const data = parseFormData(formData);
  await prisma.service.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description ?? null,
      durationMin: data.durationMin,
      priceCents: Math.round(data.priceArs * 100),
      depositPct: data.depositPct ?? null,
      active: data.active ?? true,
    },
  });
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function updateService(id: string, formData: FormData) {
  const tenantId = await requireTenantId();
  const data = parseFormData(formData);
  await prisma.service.updateMany({
    where: { id, tenantId },
    data: {
      name: data.name,
      description: data.description ?? null,
      durationMin: data.durationMin,
      priceCents: Math.round(data.priceArs * 100),
      depositPct: data.depositPct ?? null,
      active: data.active ?? true,
    },
  });
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function deleteService(id: string) {
  const tenantId = await requireTenantId();
  await prisma.service.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/services");
}
