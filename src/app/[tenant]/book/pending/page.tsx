import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug, isReservedSlug } from "@/lib/tenant";

export default async function BookingPendingPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const tenant = await getTenantBySlug(slug);
  if (!tenant?.active) notFound();

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-2xl font-semibold">Pago pendiente</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Mercado Pago todavía está procesando tu pago. Te avisaremos por email
          cuando tu turno quede confirmado.
        </p>
        <Link
          href={`/${tenant.slug}`}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Volver
        </Link>
      </div>
    </div>
  );
}
