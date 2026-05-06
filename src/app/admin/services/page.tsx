import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteService } from "./actions";
import { BusinessTypeIcon } from "@/app/_components/BusinessTypeIcon";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";
import { ConfirmDeleteForm } from "../_components/ConfirmDeleteForm";
import {
  ClockIcon,
  CreditCardIcon,
  PlusIcon,
} from "../_components/AdminIcons";
import { ServicesTabs } from "./_components/ServicesTabs";

export default async function ServicesPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const [tenant, services] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { businessType: true },
    }),
    prisma.service.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const isNails = tenant?.businessType === "nails";

  return (
    <div>
      <ServicesTabs active="services" showNails={isNails} />
      <PageHeader
        title="Servicios"
        description="Lo que ofrecés y cuánto cobrás. Tus clientes los ven al reservar."
        actions={[
          {
            kind: "primary",
            label: "Nuevo servicio",
            href: "/admin/services/new",
            icon: <PlusIcon />,
          },
        ]}
      />
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {services.length === 0 ? (
          <EmptyState
            icon={<BusinessTypeIcon businessType={tenant?.businessType} className="h-6 w-6" />}
            title="Todavía no creaste servicios"
            description="Agregá uno para que tus clientes puedan reservar."
            action={{ label: "Crear primer servicio", href: "/admin/services/new" }}
          />
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-emerald-100 text-sky-600 dark:from-sky-950/60 dark:to-emerald-950/60 dark:text-sky-300">
                  <BusinessTypeIcon businessType={tenant?.businessType} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{s.name}</p>
                    {isNails && s.category && (
                      <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                        {s.category === "hands" ? "Manos" : "Pies"}
                      </span>
                    )}
                    {!s.active && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-800">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <ClockIcon className="h-3 w-3" />
                      {s.durationMin} min
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      ${(s.priceCents / 100).toLocaleString("es-AR")}
                    </span>
                    {s.depositPct != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                        <CreditCardIcon className="h-3 w-3" />
                        seña {s.depositPct}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/services/${s.id}`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Editar
                  </Link>
                  <ConfirmDeleteForm
                    action={deleteService.bind(null, s.id)}
                    message={`¿Borrar el servicio "${s.name}"? Esta acción no se puede deshacer.`}
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
