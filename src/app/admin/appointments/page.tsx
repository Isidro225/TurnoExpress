import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";
import { Avatar } from "../_components/Avatar";
import { StatusBadge } from "../_components/StatusBadge";
import { ClipboardIcon, CreditCardIcon } from "../_components/AdminIcons";

export default async function AppointmentsPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const appts = await prisma.appointment.findMany({
    where: { tenantId },
    orderBy: { startsAt: "desc" },
    take: 50,
    include: { service: true, staff: true, payments: true },
  });

  return (
    <div>
      <PageHeader
        title="Turnos"
        description="Los últimos 50 turnos. Tocá uno para ver detalle, reagendar o cancelar."
      />
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {appts.length === 0 ? (
          <EmptyState
            icon={<ClipboardIcon className="h-6 w-6" />}
            title="No hay turnos todavía"
            description="Cuando tus clientes reserven, los vas a ver aparecer acá."
          />
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {appts.map((a) => {
              const paid = a.payments.some((p) => p.status === "APPROVED");
              return (
                <li key={a.id}>
                  <Link
                    href={`/admin/appointments/${a.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
                  >
                    <Avatar name={a.customerName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.customerName}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {a.service.name} · {a.staff.name}
                      </p>
                    </div>
                    <div className="hidden text-right text-xs text-zinc-500 sm:block">
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">
                        {format(a.startsAt, "d MMM yyyy", { locale: es })}
                      </p>
                      <p>{format(a.startsAt, "HH:mm")}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={a.status} />
                      {paid && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                          <CreditCardIcon className="h-3 w-3" />
                          pagada
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
