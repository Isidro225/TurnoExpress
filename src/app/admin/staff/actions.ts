"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const staffSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().or(z.literal("")).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  active: z.boolean().optional(),
});

async function requireTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("No autenticado");
  return session.user.tenantId;
}

function parseStaffForm(form: FormData) {
  return staffSchema.parse({
    name: form.get("name"),
    email: form.get("email") || null,
    phone: form.get("phone") || null,
    bio: form.get("bio") || null,
    active: form.get("active") === "on" || form.get("active") === "true",
  });
}

export async function createStaff(formData: FormData) {
  const tenantId = await requireTenantId();
  const data = parseStaffForm(formData);
  const created = await prisma.staff.create({
    data: {
      tenantId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      bio: data.bio || null,
      active: data.active ?? true,
    },
  });
  revalidatePath("/admin/staff");
  redirect(`/admin/staff/${created.id}`);
}

export async function updateStaff(id: string, formData: FormData) {
  const tenantId = await requireTenantId();
  const data = parseStaffForm(formData);
  await prisma.staff.updateMany({
    where: { id, tenantId },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      bio: data.bio || null,
      active: data.active ?? true,
    },
  });
  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function deleteStaff(id: string) {
  const tenantId = await requireTenantId();
  await prisma.staff.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/staff");
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule (horario semanal)
// ─────────────────────────────────────────────────────────────────────────────

function timeToMinutes(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value) return null;
  const m = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export async function updateSchedule(staffId: string, formData: FormData) {
  const tenantId = await requireTenantId();
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId },
    select: { id: true },
  });
  if (!staff) throw new Error("Staff no encontrado");

  const blocks: { weekday: number; startMin: number; endMin: number }[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    const enabled = formData.get(`day-${weekday}-enabled`) === "on";
    if (!enabled) continue;
    const start = timeToMinutes(formData.get(`day-${weekday}-start`));
    const end = timeToMinutes(formData.get(`day-${weekday}-end`));
    if (start == null || end == null || end <= start) continue;
    blocks.push({ weekday, startMin: start, endMin: end });
  }

  await prisma.$transaction([
    prisma.staffSchedule.deleteMany({ where: { staffId } }),
    prisma.staffSchedule.createMany({
      data: blocks.map((b) => ({ ...b, staffId })),
    }),
  ]);

  revalidatePath(`/admin/staff/${staffId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Asignación de servicios
// ─────────────────────────────────────────────────────────────────────────────

export async function updateStaffServices(staffId: string, formData: FormData) {
  const tenantId = await requireTenantId();
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId },
    select: { id: true },
  });
  if (!staff) throw new Error("Staff no encontrado");

  const serviceIds = formData
    .getAll("serviceId")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  // Validar que todos los servicios pertenezcan al tenant.
  const valid = await prisma.service.findMany({
    where: { tenantId, id: { in: serviceIds } },
    select: { id: true },
  });
  const validIds = new Set(valid.map((s) => s.id));

  await prisma.$transaction([
    prisma.staffService.deleteMany({ where: { staffId } }),
    prisma.staffService.createMany({
      data: [...validIds].map((serviceId) => ({ staffId, serviceId })),
    }),
  ]);

  revalidatePath(`/admin/staff/${staffId}`);
}
