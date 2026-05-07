"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");
  return session.user.tenantId;
}

const updateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().or(z.literal("")).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function updateCustomer(id: string, formData: FormData) {
  const tenantId = await requireTenantId();

  const parsed = updateSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || null,
    notes: formData.get("notes") || null,
  });

  await prisma.customer.updateMany({
    where: { id, tenantId },
    data: {
      name: parsed.name,
      email: parsed.email || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/customers");
}
