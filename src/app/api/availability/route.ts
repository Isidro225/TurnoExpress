import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAvailability } from "@/lib/availability";

const querySchema = z.object({
  tenant: z.string().min(1),
  service: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  staff: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    tenant: url.searchParams.get("tenant"),
    service: url.searchParams.get("service"),
    date: url.searchParams.get("date"),
    staff: url.searchParams.get("staff") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: parsed.data.tenant },
    select: { id: true, active: true },
  });
  if (!tenant?.active) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  const [yyyy, mm, dd] = parsed.data.date.split("-").map(Number);
  const date = new Date(yyyy, mm - 1, dd);

  const availability = await getAvailability({
    tenantId: tenant.id,
    serviceId: parsed.data.service,
    date,
    staffId: parsed.data.staff,
  });

  return NextResponse.json({
    availability: availability.map((s) => ({
      staffId: s.staffId,
      staffName: s.staffName,
      slots: s.slots.map((slot) => ({
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
      })),
    })),
  });
}
