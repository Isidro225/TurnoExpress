import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug, isReservedSlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function TenantPublicPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  if (isReservedSlug(slug)) notFound();

  const tenant = await getTenantBySlug(slug);
  if (!tenant || !tenant.active) notFound();

  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id, active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header
        className="border-b border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-900"
        style={tenant.primaryColor ? { borderTopColor: tenant.primaryColor, borderTopWidth: 4 } : undefined}
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold">{tenant.name}</h1>
          {tenant.description && (
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">{tenant.description}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="mb-4 text-lg font-semibold">Reservá tu turno</h2>
        {services.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Todavía no hay servicios disponibles. Volvé más tarde.
          </p>
        ) : (
          <ul className="space-y-3">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-zinc-500">
                    {s.durationMin} min · ${(s.priceCents / 100).toLocaleString("es-AR")}
                  </p>
                </div>
                <Link
                  href={`/${tenant.slug}/book?service=${s.id}`}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
                >
                  Reservar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
