import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  isActivePendingPaymentHold,
  visibleAppointmentWhere,
} from "@/lib/payment-holds";
import { updateCustomer } from "../actions";
import { PageHeader } from "../../_components/PageHeader";
import { Avatar } from "../../_components/Avatar";
import { StatusBadge } from "../../_components/StatusBadge";
import { CheckIcon } from "../../_components/AdminIcons";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const now = new Date();

  const customer = await prisma.customer.findFirst({
    where: { id, tenantId },
    include: {
      appointments: {
        where: visibleAppointmentWhere(now),
        orderBy: { startsAt: "desc" },
        include: { service: true, staff: true },
      },
    },
  });
  if (!customer) notFound();

  const upcoming = customer.appointments.filter(
    (a) =>
      a.startsAt >= now &&
      (a.status === "CONFIRMED" ||
        (a.status === "PENDING_PAYMENT" &&
          isActivePendingPaymentHold(a.createdAt, now)))
  );
  const totalSpentCents = customer.appointments
    .filter((a) => a.status === "COMPLETED" || a.status === "CONFIRMED")
    .reduce((sum, a) => sum + a.priceCents, 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/admin/customers" className="hover:text-zinc-900 dark:hover:text-zinc-200">
          Clientes
        </Link>
        <span className="text-zinc-400">/</span>
        <span>{customer.name}</span>
      </div>

      <PageHeader title={customer.name} description={formatPhone(customer.phone)} />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Turnos totales
          </p>
          <p className="mt-1 text-2xl font-semibold">{customer.appointments.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Próximos
          </p>
          <p className="mt-1 text-2xl font-semibold">{upcoming.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Facturado
          </p>
          <p className="mt-1 text-2xl font-semibold">
            ${(totalSpentCents / 100).toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <header className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold">Historial de turnos</h2>
          </header>
          {customer.appointments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-zinc-500">Aún no tiene turnos.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {customer.appointments.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/appointments/${a.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
                  >
                    <Avatar name={a.staff.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {a.service.name}
                        {a.secondaryServiceName && (
                          <span className="text-zinc-500"> + {a.secondaryServiceName}</span>
                        )}
                        {a.designName && (
                          <span className="text-zinc-500"> · {a.designName}</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {format(a.startsAt, "EEEE d MMM yyyy · HH:mm", { locale: es })} ·{" "}
                        {a.staff.name}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold">Datos del cliente</h2>
            <form action={updateCustomer.bind(null, customer.id)} className="space-y-4">
              <Field label="Nombre">
                <input
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={customer.name}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  defaultValue={customer.email ?? ""}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Teléfono" hint="Cambiarlo regagrupa los turnos. Por ahora es de sólo lectura.">
                <input
                  value={formatPhone(customer.phone)}
                  readOnly
                  className={`${INPUT_CLS} cursor-not-allowed bg-zinc-50 dark:bg-zinc-950`}
                />
              </Field>
              <Field label="Notas internas" hint="Sólo vos las ves. Útil para alergias, preferencias, etc.">
                <textarea
                  name="notes"
                  rows={5}
                  maxLength={2000}
                  defaultValue={customer.notes ?? ""}
                  className={INPUT_CLS}
                />
              </Field>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-500/25 transition hover:shadow-md hover:shadow-sky-500/40"
                >
                  <CheckIcon className="h-4 w-4" />
                  Guardar
                </button>
              </div>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
