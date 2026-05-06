"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const priorSchema = z.object({
  name: z.string().min(1).max(120),
  removalMin: z.coerce.number().int().min(5).max(8 * 60),
  active: z.coerce.boolean().optional(),
});

async function requireTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");
  return session.user.tenantId;
}

function parseFormData(form: FormData) {
  return priorSchema.parse({
    name: form.get("name"),
    removalMin: form.get("removalMin"),
    active: form.get("active") === "on" || form.get("active") === "true",
  });
}

export async function createPriorService(formData: FormData) {
  const tenantId = await requireTenantId();
  const data = parseFormData(formData);
  await prisma.priorService.create({
    data: {
      tenantId,
      name: data.name,
      removalMin: data.removalMin,
      active: data.active ?? true,
    },
  });
  revalidatePath("/admin/services/prior");
  redirect("/admin/services/prior");
}

export async function updatePriorService(id: string, formData: FormData) {
  const tenantId = await requireTenantId();
  const data = parseFormData(formData);
  await prisma.priorService.updateMany({
    where: { id, tenantId },
    data: {
      name: data.name,
      removalMin: data.removalMin,
      active: data.active ?? true,
    },
  });
  revalidatePath("/admin/services/prior");
  redirect("/admin/services/prior");
}

export async function deletePriorService(id: string) {
  const tenantId = await requireTenantId();
  await prisma.priorService.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/services/prior");
}
