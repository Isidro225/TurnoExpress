import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "./book/BookingFlow";

export default async function TenantPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { tenant: slug } = await params;
  const sp = await searchParams;
  const tenant = (await getTenantBySlug(slug))!;

  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id, active: true },
    orderBy: { name: "asc" },
    include: {
      staff: {
        where: { staff: { active: true } },
        include: { staff: { select: { id: true, name: true } } },
      },
    },
  });

  const servicesForFlow = services
    .filter((s) => s.staff.length > 0)
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMin: s.durationMin,
      priceCents: s.priceCents,
      depositPct: s.depositPct ?? tenant.depositPct,
      staff: s.staff.map((ss) => ({ id: ss.staff.id, name: ss.staff.name })),
    }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Reservá tu turno</h1>

      {servicesForFlow.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Todavía no hay servicios con profesional asignado. Volvé en un rato.
        </div>
      ) : (
        <BookingFlow
          tenantSlug={tenant.slug}
          mpEnabled={!!tenant.mpAccessToken}
          services={servicesForFlow}
          initialServiceId={sp.service ?? null}
        />
      )}
    </div>
  );
}
