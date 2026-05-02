import { notFound } from "next/navigation";
import { getTenantBySlug, isReservedSlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "./BookingFlow";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { tenant: slug } = await params;
  const { service: serviceId } = await searchParams;
  if (isReservedSlug(slug)) notFound();

  const tenant = await getTenantBySlug(slug);
  if (!tenant?.active) notFound();

  if (!serviceId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-zinc-500">Elegí un servicio para reservar.</p>
      </div>
    );
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId: tenant.id, active: true },
    include: {
      staff: {
        where: { staff: { active: true } },
        include: { staff: true },
      },
    },
  });
  if (!service) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-zinc-500">Servicio no encontrado.</p>
      </div>
    );
  }

  const staffOptions = service.staff.map((s) => ({
    id: s.staff.id,
    name: s.staff.name,
  }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Reservar {service.name}</h1>
        <p className="text-sm text-zinc-500">
          {service.durationMin} min · ${(service.priceCents / 100).toLocaleString("es-AR")}
        </p>
      </header>

      {staffOptions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Todavía no hay profesionales asignados a este servicio.
        </p>
      ) : (
        <BookingFlow
          tenantSlug={tenant.slug}
          serviceId={service.id}
          serviceName={service.name}
          durationMin={service.durationMin}
          priceCents={service.priceCents}
          mpEnabled={!!tenant.mpAccessToken}
          staffOptions={staffOptions}
        />
      )}
    </div>
  );
}
