import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  cancelAppointment,
  deleteAppointment,
  rescheduleAppointment,
  setAppointmentStatus,
} from "../actions";
import { RescheduleForm } from "./RescheduleForm";
import { PageHeader } from "../../_components/PageHeader";
import { Avatar } from "../../_components/Avatar";
import { StatusBadge } from "../../_components/StatusBadge";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const tenantId = session!.user.tenantId!;

  const appointment = await prisma.appointment.findFirst({
    where: { id, tenantId },
    include: {
      service: true,
      staff: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!appointment) notFound();

  // Staff que atienden este servicio (para el reagendar)
  const eligibleStaff = await prisma.staff.findMany({
    where: {
      tenantId,
      active: true,
      services: { some: { serviceId: appointment.serviceId } },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const isFinal = ["COMPLETED", "CANCELLED"].includes(appointment.status);
  const canReschedule = !isFinal;

  // Defaults para el form: separamos fecha y hora interpretando en TZ del servidor.
  // El cliente reinterpreta al render (mismo Date, distinta zona).
  const defaultDate = appointment.startsAt.toISOString().slice(0, 10);
  const defaultTime = appointment.startsAt.toISOString().slice(11, 16);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={appointment.customerName}
        breadcrumbs={[
          { label: "Turnos", href: "/admin/appointments" },
          { label: "Detalle", href: "#" },
        ]}
      />

      <div className="-mt-4 flex flex-wrap items-center gap-3">
        <Avatar name={appointment.customerName} size="md" />
        <StatusBadge status={appointment.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Cliente">
          <Row label="Nombre" value={appointment.customerName} />
          <Row label="Email" value={appointment.customerEmail} />
          <Row label="Teléfono" value={appointment.customerPhone ?? "—"} />
          {appointment.notes && <Row label="Notas" value={appointment.notes} />}
        </Card>

        <Card title="Servicio">
          <Row label="Servicio" value={appointment.service.name} />
          {appointment.secondaryServiceName && (
            <Row
              label="Sumando"
              value={
                appointment.secondaryServicePriceCents != null
                  ? `${appointment.secondaryServiceName} (+$${(appointment.secondaryServicePriceCents / 100).toLocaleString("es-AR")})`
                  : appointment.secondaryServiceName
              }
            />
          )}
          <Row label="Profesional" value={appointment.staff.name} />
          <Row
            label="Duración"
            value={`${appointment.service.durationMin + appointment.extraMinutes} min`}
          />
          <Row
            label="Fecha"
            value={appointment.startsAt.toLocaleString("es-AR")}
          />
          <Row
            label="Precio total"
            value={`$${(appointment.priceCents / 100).toLocaleString("es-AR")}`}
          />
          <Row
            label="Seña"
            value={`$${(appointment.depositCents / 100).toLocaleString("es-AR")}`}
          />
        </Card>
      </div>

      {/* Pagos */}
      <Card title="Pagos">
        {appointment.payments.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin movimientos.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {appointment.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">
                    ${(p.amountCents / 100).toLocaleString("es-AR")}{" "}
                    <span className="text-zinc-500">· {p.provider}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {p.createdAt.toLocaleString("es-AR")} ·{" "}
                    {p.preferenceId
                      ? `pref ${p.preferenceId.slice(-8)}`
                      : "sin preferenceId"}
                    {p.paymentId ? ` · pay ${p.paymentId}` : ""}
                  </p>
                </div>
                <span className="text-xs text-zinc-500">{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Reagendar */}
      {canReschedule && eligibleStaff.length > 0 && (
        <Card title="Reagendar">
          <p className="mb-3 text-sm text-zinc-500">
            Cambiá el día, la hora o la persona que atiende. Validamos que el horario esté libre.
          </p>
          <RescheduleForm
            action={rescheduleAppointment.bind(null, appointment.id)}
            defaultDate={defaultDate}
            defaultTime={defaultTime}
            defaultStaffId={appointment.staffId}
            staffOptions={eligibleStaff}
          />
        </Card>
      )}

      {/* Acciones */}
      <Card title="Acciones">
        <div className="flex flex-wrap gap-2">
          {appointment.status !== "CONFIRMED" && !isFinal && (
            <form
              action={async () => {
                "use server";
                await setAppointmentStatus(appointment.id, "CONFIRMED");
              }}
            >
              <ActionButton tone="emerald">Marcar confirmado</ActionButton>
            </form>
          )}
          {appointment.status !== "COMPLETED" && !isFinal && (
            <form
              action={async () => {
                "use server";
                await setAppointmentStatus(appointment.id, "COMPLETED");
              }}
            >
              <ActionButton tone="zinc">Marcar completado</ActionButton>
            </form>
          )}
          {appointment.status !== "NO_SHOW" && !isFinal && (
            <form
              action={async () => {
                "use server";
                await setAppointmentStatus(appointment.id, "NO_SHOW");
              }}
            >
              <ActionButton tone="red-soft">No se presentó</ActionButton>
            </form>
          )}
          {!isFinal && (
            <form action={cancelAppointment.bind(null, appointment.id)}>
              <ActionButton tone="red">Cancelar turno</ActionButton>
            </form>
          )}
          <form action={deleteAppointment.bind(null, appointment.id)}>
            <ActionButton tone="red-outline">Eliminar registro</ActionButton>
          </form>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 py-1.5 text-sm last:border-0 dark:border-zinc-800">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}

function ActionButton({
  tone,
  children,
}: {
  tone: "emerald" | "zinc" | "red" | "red-soft" | "red-outline";
  children: React.ReactNode;
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
      : tone === "zinc"
        ? "border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        : tone === "red"
          ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
          : tone === "red-soft"
            ? "border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100"
            : "border-red-300 text-red-600 hover:bg-red-50";
  return (
    <button
      type="submit"
      className={`rounded-md border px-3 py-1.5 text-sm ${cls}`}
    >
      {children}
    </button>
  );
}
