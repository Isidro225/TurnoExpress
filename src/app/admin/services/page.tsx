import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteService } from "./actions";

export default async function ServicesPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const services = await prisma.service.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Servicios</h1>
        <Link
          href="/admin/services/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-zinc-900"
        >
          Nuevo servicio
        </Link>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {services.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            Todavía no creaste servicios. Agregá uno para que tus clientes puedan reservar.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {services.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-zinc-500">
                    {s.durationMin} min · ${(s.priceCents / 100).toLocaleString("es-AR")}
                    {s.depositPct != null ? ` · seña ${s.depositPct}%` : ""}
                    {!s.active ? " · inactivo" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/services/${s.id}`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Editar
                  </Link>
                  <form action={deleteService.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                    >
                      Borrar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
