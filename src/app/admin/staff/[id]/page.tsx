import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StaffForm } from "../StaffForm";
import { updateStaff, updateSchedule, updateStaffServices } from "../actions";

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const staff = await prisma.staff.findFirst({
    where: { id, tenantId },
    include: {
      schedules: true,
      services: { select: { serviceId: true } },
    },
  });
  if (!staff) notFound();

  const services = await prisma.service.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  const schedulesByWeekday = new Map<number, { startMin: number; endMin: number }>();
  for (const s of staff.schedules) {
    schedulesByWeekday.set(s.weekday, { startMin: s.startMin, endMin: s.endMin });
  }
  const assignedServiceIds = new Set(staff.services.map((s) => s.serviceId));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-6">Editar persona</h1>
        <StaffForm
          action={updateStaff.bind(null, staff.id)}
          initial={{
            name: staff.name,
            email: staff.email,
            phone: staff.phone,
            bio: staff.bio,
            active: staff.active,
          }}
          submitLabel="Guardar"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Horario semanal</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Marcá los días que trabaja y el rango horario.
        </p>
        <form action={updateSchedule.bind(null, staff.id)} className="max-w-xl space-y-2">
          {WEEKDAYS.map((label, weekday) => {
            const block = schedulesByWeekday.get(weekday);
            return (
              <div
                key={weekday}
                className="grid grid-cols-[6rem_auto_1fr_1fr] items-center gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <span className="text-sm font-medium">{label}</span>
                <input
                  type="checkbox"
                  name={`day-${weekday}-enabled`}
                  defaultChecked={!!block}
                />
                <input
                  type="time"
                  name={`day-${weekday}-start`}
                  defaultValue={block ? minutesToHHMM(block.startMin) : "09:00"}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
                <input
                  type="time"
                  name={`day-${weekday}-end`}
                  defaultValue={block ? minutesToHHMM(block.endMin) : "18:00"}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
            );
          })}
          <button
            type="submit"
            className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
          >
            Guardar horario
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Servicios que ofrece</h2>
        {services.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Primero creá servicios desde la sección{" "}
            <Link href="/admin/services" className="underline">
              Servicios
            </Link>
            .
          </p>
        ) : (
          <form action={updateStaffServices.bind(null, staff.id)} className="max-w-xl space-y-2">
            {services.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <input
                  type="checkbox"
                  name="serviceId"
                  value={s.id}
                  defaultChecked={assignedServiceIds.has(s.id)}
                />
                <span className="font-medium">{s.name}</span>
                <span className="text-zinc-500">
                  · {s.durationMin} min · ${(s.priceCents / 100).toLocaleString("es-AR")}
                </span>
              </label>
            ))}
            <button
              type="submit"
              className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
            >
              Guardar servicios
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
