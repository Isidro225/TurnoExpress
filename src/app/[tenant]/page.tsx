import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { isBookingPaymentBypassEnabled } from "@/lib/booking-payment";
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
  const paymentBypassEnabled = isBookingPaymentBypassEnabled();

  const isNails = tenant.businessType === "nails";

  const [services, priorServices, designs] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { name: "asc" },
      include: {
        staff: {
          where: { staff: { active: true } },
          include: { staff: { select: { id: true, name: true } } },
        },
      },
    }),
    isNails
      ? prisma.priorService.findMany({
          where: { tenantId: tenant.id, active: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, removalMin: true },
        })
      : Promise.resolve([]),
    isNails
      ? prisma.design.findMany({
          where: { tenantId: tenant.id, active: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, durationMin: true, priceCents: true },
        })
      : Promise.resolve([]),
  ]);

  const servicesForFlow = services
    .filter((s) => s.staff.length > 0)
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMin: s.durationMin,
      priceCents: s.priceCents,
      depositPct: s.depositPct ?? tenant.depositPct,
      category: isNails ? s.category ?? null : null,
      staff: s.staff.map((ss) => ({ id: ss.staff.id, name: ss.staff.name })),
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {servicesForFlow.length === 0 ? (
        <div className="rounded-lg border border-[color:var(--brand-border)] bg-white p-6 text-sm shadow-sm">
          <p className="font-semibold text-zinc-950">Todavía no hay turnos disponibles</p>
          <p className="mt-1 text-zinc-500">
            El negocio todavía no cargó servicios con profesional asignado. Volvé en un rato.
          </p>
        </div>
      ) : (
        <BookingFlow
          tenantSlug={tenant.slug}
          businessType={tenant.businessType}
          mpEnabled={!!tenant.mpAccessToken}
          paymentBypassEnabled={paymentBypassEnabled}
          services={servicesForFlow}
          priorServices={priorServices}
          designs={designs}
          depositMinCents={tenant.depositMinCents}
          initialServiceId={sp.service ?? null}
        />
      )}
    </div>
  );
}
