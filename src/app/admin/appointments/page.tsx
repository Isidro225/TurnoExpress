import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
              <li key={a.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{a.customerName}</p>
                  <p className="text-sm text-zinc-500">
                    {a.service.name} · {a.staff.name}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{a.startsAt.toLocaleString("es-AR")}</p>
                  <p className="text-zinc-500">{a.status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
