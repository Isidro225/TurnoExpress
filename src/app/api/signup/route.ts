import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isReservedSlug, normalizeSlug } from "@/lib/tenant";

const signupSchema = z.object({
  businessName: z.string().min(2).max(80),
  slug: z.string().min(2).max(40),
  email: z.string().email(),
  password: z.string().min(8),
  ownerName: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const slug = normalizeSlug(parsed.data.slug);
  if (!slug || isReservedSlug(slug)) {
    return NextResponse.json({ error: "Ese slug no está disponible" }, { status: 400 });
  }

  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    return NextResponse.json({ error: "Ese slug ya está en uso" }, { status: 409 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name: parsed.data.businessName,
      users: {
        create: {
          email: parsed.data.email,
          name: parsed.data.ownerName,
          passwordHash,
          role: "OWNER",
        },
      },
    },
    include: { users: true },
  });

  return NextResponse.json({
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
  });
}
