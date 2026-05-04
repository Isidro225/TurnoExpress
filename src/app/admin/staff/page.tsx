import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteStaff } from "./actions";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";
import { Avatar } from "../_components/Avatar";
import { ConfirmDeleteForm } from "../_components/ConfirmDeleteForm";
import { PlusIcon, UsersIcon } from "../_components/AdminIcons";

export default async function StaffPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const staff = await prisma.staff.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Personal"
        description="Las personas que atienden. Cada una tiene su horario y servicios."
        actions={[
          {
            kind: "primary",
            label: "Agregar",
            href: "/admin/staff/new",
            icon: <PlusIcon />,
          },
        ]}
      />
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {staff.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-6 w-6" />}
            title="Todavía no agregaste personal"
            description="Cargá a las personas que atienden para que los clientes elijan con quién atenderse."
            action={{ label: "Agregar primera persona", href: "/admin/staff/new" }}
          />
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {staff.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
              >
                <Avatar name={s.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{s.name}</p>
                    {!s.active && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-800">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{s.email ?? "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/staff/${s.id}`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Editar
                  </Link>
                  <ConfirmDeleteForm
                    action={deleteStaff.bind(null, s.id)}
                    message={`¿Borrar a "${s.name}"? Sus turnos se mantendrán pero no podrá tomar nuevos.`}
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
