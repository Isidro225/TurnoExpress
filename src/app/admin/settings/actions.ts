"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  depositPct: z.coerce.number().int().min(0).max(100),
});

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");
  const tenantId = session.user.tenantId;

  const data = settingsSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    primaryColor: formData.get("primaryColor") || null,
    depositPct: formData.get("depositPct") ?? 30,
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: data.name,
      description: data.description ?? null,
      primaryColor: data.primaryColor ?? null,
      depositPct: data.depositPct,
    },
  });

  revalidatePath("/admin/settings");
}

export async function disconnectMercadoPago() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { mpAccessToken: null, mpPublicKey: null },
  });

  revalidatePath("/admin/settings");
}
