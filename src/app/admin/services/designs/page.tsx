import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteDesign } from "./actions";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";
import { ConfirmDeleteForm } from "../../_components/ConfirmDeleteForm";
import { ClockIcon, PlusIcon, ScissorsIcon } from "../../_components/AdminIcons";
import { ServicesTabs } from "../_components/ServicesTabs";

export default async function DesignsPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { businessType: true },
  });
  if (tenant?.businessType !== "nails") notFound();

  const items = await prisma.design.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <ServicesTabs active="designs" showNails />
      <PageHeader
        title="Diseños"
        description="Diseños que la cliente puede sumar a su servicio. Cada uno con su tiempo extra y precio."
        actions={[
          {
            kind: "primary",
            label: "Nuevo diseño",
            href: "/admin/services/designs/new",
            icon: <PlusIcon />,
          },
        ]}
      />
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {items.length === 0 ? (
          <EmptyState
            icon={<ScissorsIcon className="h-6 w-6" />}
            title="Todavía no agregaste diseños"
            description="Cargá los diseños que ofrecés. La cliente los va a poder elegir al reservar."
            action={{ label: "Crear primer diseño", href: "/admin/services/designs/new" }}
          />
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{d.name}</p>
                    {!d.active && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-800">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <ClockIcon className="h-3 w-3" />
                      +{d.durationMin} min
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      ${(d.priceCents / 100).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/services/designs/${d.id}`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Editar
                  </Link>
                  <ConfirmDeleteForm
                    action={deleteDesign.bind(null, d.id)}
                    message={`¿Borrar el diseño "${d.name}"? Esta acción no se puede deshacer.`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
