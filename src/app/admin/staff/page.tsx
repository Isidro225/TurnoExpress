import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteStaff } from "./actions";

export default async function StaffPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const staff = await prisma.staff.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Personal</h1>
        <Link
          href="/admin/staff/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-zinc-900"
        >
          Agregar
        </Link>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {staff.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            Cargá a las personas que atienden para que los clientes elijan con quién atenderse.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-zinc-500">
                    {s.email ?? "—"}
                    {!s.active ? " · inactivo" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/staff/${s.id}`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Editar
                  </Link>
                  <form action={deleteStaff.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                    >
                      Borrar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
