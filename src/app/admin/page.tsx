import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

export default async function AdminDashboard() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;

  const now = new Date();
  const [totalToday, totalMonth, confirmedMonth, revenueMonth] = await Promise.all([
    prisma.appointment.count({
      where: { tenantId, startsAt: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    prisma.appointment.count({
      where: { tenantId, startsAt: { gte: startOfMonth(now), lte: endOfMonth(now) } },
    }),
    prisma.appointment.count({
      where: {
        tenantId,
        status: "CONFIRMED",
        startsAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
    }),
    prisma.payment.aggregate({
      where: {
        tenantId,
        status: "APPROVED",
        createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const upcoming = await prisma.appointment.findMany({
    where: { tenantId, startsAt: { gte: now } },
    orderBy: { startsAt: "asc" },
    take: 5,
    include: { service: true, staff: true },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="text-sm text-zinc-500">Hola {session!.user.name ?? session!.user.email}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Turnos hoy" value={totalToday} />
        <Stat label="Turnos del mes" value={totalMonth} />
        <Stat label="Confirmados (mes)" value={confirmedMonth} />
        <Stat
          label="Ingresos mes (señas)"
          value={`$${((revenueMonth._sum.amountCents ?? 0) / 100).toLocaleString("es-AR")}`}
        />
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Próximos turnos</h2>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {upcoming.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500">Todavía no hay turnos próximos.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {upcoming.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{appt.customerName}</p>
                    <p className="text-sm text-zinc-500">
                      {appt.service.name} · {appt.staff.name}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{appt.startsAt.toLocaleString("es-AR")}</p>
                    <p className="text-zinc-500">{appt.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
