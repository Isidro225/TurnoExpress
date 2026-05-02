import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true, slug: true },
  });
  if (!tenant) redirect("/login");

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="w-60 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Negocio</p>
          <p className="font-semibold">{tenant.name}</p>
          <Link
            href={`/${tenant.slug}`}
            className="text-xs text-zinc-500 underline"
            target="_blank"
          >
            ver turnera pública
          </Link>
        </div>

        <nav className="space-y-1 text-sm">
          <NavLink href="/admin">Resumen</NavLink>
          <NavLink href="/admin/calendar">Calendario</NavLink>
          <NavLink href="/admin/appointments">Turnos</NavLink>
          <NavLink href="/admin/services">Servicios</NavLink>
          <NavLink href="/admin/staff">Personal</NavLink>
          <NavLink href="/admin/settings">Configuración</NavLink>
        </nav>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="mt-8"
        >
          <button className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            Cerrar sesión
          </button>
        </form>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {children}
    </Link>
  );
}
