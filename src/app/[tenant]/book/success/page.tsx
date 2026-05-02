import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug, isReservedSlug } from "@/lib/tenant";
import { mpPayment } from "@/lib/mercadopago";

// MP redirige acá con: payment_id, status, external_reference (appointmentId), preference_id, merchant_order_id.
// Reconciliamos consultando al MP por seguridad (no confiamos sólo en los query params del cliente).
export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{
    id?: string;
    payment_id?: string;
    status?: string;
    external_reference?: string;
  }>;
}) {
  const { tenant: slug } = await params;
  const sp = await searchParams;
  if (isReservedSlug(slug)) notFound();

  const tenant = await getTenantBySlug(slug);
  if (!tenant?.active) notFound();

  const appointmentId = sp.id ?? sp.external_reference;
  if (!appointmentId) {
    return <Centered>No encontramos tu reserva.</Centered>;
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId: tenant.id },
    include: { service: true, staff: true, payments: true },
  });
  if (!appointment) {
    return <Centered>No encontramos tu reserva.</Centered>;
  }

  // Reconciliar con MP si tenemos payment_id y el negocio tiene token configurado.
  if (sp.payment_id && tenant.mpAccessToken && appointment.status === "PENDING_PAYMENT") {
    try {
      const detail = await mpPayment(tenant.mpAccessToken).get({ id: sp.payment_id });
      const status = (detail.status ?? "").toLowerCase();
      const mapped =
        status === "approved"
          ? "APPROVED"
          : status === "rejected"
            ? "REJECTED"
            : status === "refunded"
              ? "REFUNDED"
              : status === "cancelled"
                ? "CANCELLED"
                : "PENDING";

      await prisma.$transaction(async (tx) => {
        const existing = await tx.payment.findFirst({
          where: { appointmentId: appointment.id },
        });
        if (existing) {
          await tx.payment.update({
            where: { id: existing.id },
            data: {
              paymentId: String(sp.payment_id),
              status: mapped,
              rawPayload: detail as object,
            },
          });
        }
        if (mapped === "APPROVED") {
          await tx.appointment.update({
            where: { id: appointment.id },
            data: { status: "CONFIRMED" },
          });
        }
      });
    } catch {
      // si falla, dejamos la reconciliación al webhook
    }
  }

  const fresh = await prisma.appointment.findUnique({
    where: { id: appointment.id },
    include: { service: true, staff: true },
  });

  const confirmed = fresh?.status === "CONFIRMED";

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-2xl font-semibold">
          {confirmed ? "¡Turno confirmado!" : "Pago en proceso"}
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          {confirmed
            ? "Te enviamos los detalles a tu email."
            : "En cuanto Mercado Pago confirme el pago tu turno queda confirmado."}
        </p>
        <dl className="space-y-2 text-sm text-left">
          <Row label="Servicio" value={fresh?.service.name ?? "—"} />
          <Row label="Profesional" value={fresh?.staff.name ?? "—"} />
          <Row
            label="Fecha"
            value={fresh ? fresh.startsAt.toLocaleString("es-AR") : "—"}
          />
          <Row
            label="Seña"
            value={`$${((fresh?.depositCents ?? 0) / 100).toLocaleString("es-AR")}`}
          />
        </dl>
        <Link
          href={`/${tenant.slug}`}
          className="mt-8 inline-block rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Volver
        </Link>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 py-2 dark:border-zinc-800">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
