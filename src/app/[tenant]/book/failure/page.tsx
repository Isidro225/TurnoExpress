import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug, isReservedSlug } from "@/lib/tenant";

// El pago falló o fue rechazado. Marcamos la appointment como CANCELLED para liberar el slot.
export default async function BookingFailurePage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ id?: string; external_reference?: string }>;
}) {
  const { tenant: slug } = await params;
  const sp = await searchParams;
  if (isReservedSlug(slug)) notFound();

  const tenant = await getTenantBySlug(slug);
  if (!tenant?.active) notFound();

  const appointmentId = sp.id ?? sp.external_reference;
  if (appointmentId) {
    await prisma.appointment.updateMany({
      where: {
        id: appointmentId,
        tenantId: tenant.id,
        status: "PENDING_PAYMENT",
      },
      data: { status: "CANCELLED" },
    });
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-2xl font-semibold">No se pudo procesar el pago</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Tu turno no quedó reservado. Podés intentarlo de nuevo cuando quieras.
        </p>
        <Link
          href={`/${tenant.slug}`}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          Volver a empezar
        </Link>
      </div>
    </div>
  );
}
