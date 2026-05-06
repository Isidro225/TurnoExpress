"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const designSchema = z.object({
  name: z.string().min(1).max(120),
  durationMin: z.coerce.number().int().min(0).max(8 * 60),
  priceArs: z.coerce.number().min(0),
  active: z.coerce.boolean().optional(),
});

async function requireTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");
  return session.user.tenantId;
}

function parseFormData(form: FormData) {
  return designSchema.parse({
    name: form.get("name"),
    durationMin: form.get("durationMin"),
    priceArs: form.get("priceArs"),
    active: form.get("active") === "on" || form.get("active") === "true",
  });
}

export async function createDesign(formData: FormData) {
  const tenantId = await requireTenantId();
  const data = parseFormData(formData);
  await prisma.design.create({
    data: {
      tenantId,
      name: data.name,
      durationMin: data.durationMin,
      priceCents: Math.round(data.priceArs * 100),
      active: data.active ?? true,
    },
  });
  revalidatePath("/admin/services/designs");
  redirect("/admin/services/designs");
}

export async function updateDesign(id: string, formData: FormData) {
  const tenantId = await requireTenantId();
  const data = parseFormData(formData);
  await prisma.design.updateMany({
    where: { id, tenantId },
    data: {
      name: data.name,
      durationMin: data.durationMin,
      priceCents: Math.round(data.priceArs * 100),
      active: data.active ?? true,
    },
  });
  revalidatePath("/admin/services/designs");
  redirect("/admin/services/designs");
}

export async function deleteDesign(id: string) {
  const tenantId = await requireTenantId();
  await prisma.design.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/services/designs");
}
