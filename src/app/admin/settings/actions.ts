"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_LOGO_BYTES = 300 * 1024; // ~300KB después de base64 (algo más que el límite cliente para tolerancia)

const logoSchema = z
  .string()
  .max(MAX_LOGO_BYTES, "Logo demasiado grande")
  .refine(
    (v) => v === "" || /^data:image\/[a-z+]+;base64,/i.test(v) || /^https?:\/\//i.test(v),
    "Formato de logo inválido"
  )
  .optional()
  .nullable();

const settingsSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  backgroundColor: z.enum(["white", "gray", "black"]).optional().nullable(),
  depositPct: z.coerce.number().int().min(0).max(100),
  logoUrl: logoSchema,
});

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");
  const tenantId = session.user.tenantId;

  const data = settingsSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    primaryColor: formData.get("primaryColor") || null,
    backgroundColor: formData.get("backgroundColor") || null,
    depositPct: formData.get("depositPct") ?? 30,
    logoUrl: formData.get("logoUrl") || null,
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: data.name,
      description: data.description ?? null,
      primaryColor: data.primaryColor ?? null,
      backgroundColor: data.backgroundColor ?? null,
      depositPct: data.depositPct,
      logoUrl: data.logoUrl || null,
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
  redirect("/admin/settings?mp=disconnected");
}

// Tokens válidos de MP empiezan con APP_USR (producción) o TEST (sandbox).
const MP_TOKEN_REGEX = /^(APP_USR|TEST)-[\w-]+$/;

const mpCredentialsSchema = z.object({
  accessToken: z
    .string()
    .min(20, "Access token demasiado corto")
    .regex(MP_TOKEN_REGEX, "Formato de access token inválido"),
  publicKey: z
    .string()
    .regex(MP_TOKEN_REGEX, "Formato de public key inválido")
    .optional()
    .or(z.literal("")),
});

export async function updateMpCredentials(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");

  const accessToken = String(formData.get("accessToken") ?? "").trim();
  const publicKey = String(formData.get("publicKey") ?? "").trim();

  const parsed = mpCredentialsSchema.safeParse({
    accessToken,
    publicKey: publicKey || undefined,
  });
  if (!parsed.success) {
    redirect("/admin/settings?mp=bad-format");
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      mpAccessToken: parsed.data.accessToken,
      mpPublicKey: parsed.data.publicKey || null,
    },
  });

  revalidatePath("/admin/settings");
  redirect("/admin/settings?mp=saved");
}

export async function verifyMpCredentials() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { mpAccessToken: true },
  });
  if (!tenant?.mpAccessToken) {
    redirect("/admin/settings?mp=no-token");
  }

  let ok = false;
  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${tenant.mpAccessToken}` },
      cache: "no-store",
    });
    ok = res.ok;
  } catch {
    ok = false;
  }

  redirect(`/admin/settings?mp=${ok ? "verified" : "verify-failed"}`);
}
