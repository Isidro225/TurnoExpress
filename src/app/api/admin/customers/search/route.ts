import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/customers";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const tenantId = session.user.tenantId;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ customers: [] });
  }

  const normalizedQ = normalizePhone(q);

  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        ...(normalizedQ ? [{ phone: { contains: normalizedQ } }] : []),
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: { id: true, name: true, phone: true, email: true },
  });

  return NextResponse.json({ customers });
}
