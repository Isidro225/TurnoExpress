import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/customers";
import { visibleAppointmentWhere } from "@/lib/payment-holds";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";
import { Avatar } from "../_components/Avatar";
import { UsersIcon } from "../_components/AdminIcons";

const PAGE_SIZE = 50;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const normalizedQ = normalizePhone(q);
  const now = new Date();

  const where = q
    ? {
        tenantId,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          ...(normalizedQ ? [{ phone: { contains: normalizedQ } }] : []),
        ],
      }
    : { tenantId };

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: PAGE_SIZE,
    include: {
      _count: {
        select: { appointments: { where: visibleAppointmentWhere(now) } },
      },
      appointments: {
        where: visibleAppointmentWhere(now),
        orderBy: { startsAt: "desc" },
        take: 1,
        select: { startsAt: true, service: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Clientes"
        description="Cada cliente agrupa sus turnos por número de teléfono."
      />

      <form className="mb-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o teléfono…"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Buscar
        </button>
        {q && (
          <Link
            href="/admin/customers"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Limpiar
          </Link>
        )}
      </form>

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {customers.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-6 w-6" />}
            title={q ? "No encontramos clientes" : "Todavía no hay clientes"}
            description={
              q
                ? "Probá con otro término o número."
                : "A medida que tomes turnos, los clientes se van a ir agrupando acá."
            }
          />
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {customers.map((c) => {
              const last = c.appointments[0];
              return (
                <li key={c.id}>
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
                  >
                    <Avatar name={c.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {formatPhone(c.phone)}
                        {c.email && <> · {c.email}</>}
                      </p>
                    </div>
                    <div className="hidden text-right text-xs text-zinc-500 sm:block">
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">
                        {c._count.appointments}{" "}
                        {c._count.appointments === 1 ? "turno" : "turnos"}
                      </p>
                      {last && (
                        <p>
                          último: {format(last.startsAt, "d MMM yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {customers.length === PAGE_SIZE && (
        <p className="mt-3 text-xs text-zinc-500">
          Mostrando los primeros {PAGE_SIZE}. Usá la búsqueda para encontrar otros.
        </p>
      )}
    </div>
  );
}

function formatPhone(phone: string): string {
  // Heurística básica: para 10 dígitos AR mostramos como "11 1234-5678",
  // para otros largos no formateamos.
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
