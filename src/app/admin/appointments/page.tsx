import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_SHOW: "No vino",
};

export default async function AppointmentsPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const appts = await prisma.appointment.findMany({
    where: { tenantId },
    orderBy: { startsAt: "desc" },
    take: 50,
    include: { service: true, staff: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Turnos</h1>
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {appts.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">No hay turnos todavía.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {appts.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/admin/appointments/${a.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.customerName}</p>
                    <p className="truncate text-sm text-zinc-500">
                      {a.service.name} · {a.staff.name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p>{a.startsAt.toLocaleString("es-AR")}</p>
                    <p className="text-zinc-500">
                      {STATUS_LABEL[a.status] ?? a.status}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
