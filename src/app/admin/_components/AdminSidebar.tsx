"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BusinessTypeIcon } from "@/app/_components/BusinessTypeIcon";
import {
  CalendarIcon,
  ClipboardIcon,
  CloseIcon,
  DashboardIcon,
  ExternalLinkIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from "./AdminIcons";

type Props = {
  tenantName: string;
  tenantSlug: string;
  businessType?: string | null;
  signOutAction: () => void | Promise<void>;
};

const NAV_ITEMS: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/admin", label: "Resumen", icon: <DashboardIcon /> },
  { href: "/admin/calendar", label: "Calendario", icon: <CalendarIcon /> },
  { href: "/admin/appointments", label: "Turnos", icon: <ClipboardIcon /> },
  { href: "/admin/customers", label: "Clientes", icon: <UserIcon /> },
  { href: "/admin/services", label: "Servicios", icon: null },
  { href: "/admin/staff", label: "Personal", icon: <UsersIcon /> },
  { href: "/admin/settings", label: "Configuración", icon: <SettingsIcon /> },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar({
  tenantName,
  tenantSlug,
  businessType,
  signOutAction,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navItems = NAV_ITEMS.map((item) =>
    item.href === "/admin/services"
      ? { ...item, icon: <BusinessTypeIcon businessType={businessType} /> }
      : item
  );

  // Cerrar drawer al navegar
  useEffect(() => {
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  // Bloquear scroll del body cuando drawer está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <>
      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/admin" className="flex items-center gap-2" aria-label="TurnoExpress admin">
          <Image src="/Icono.png" alt="" width={331} height={277} className="h-7 w-auto" />
          <span className="text-base font-bold tracking-tight">
            <span className="text-zinc-900 dark:text-zinc-50">Turno</span>
            <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
              Express
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          aria-label="Abrir menú"
        >
          <MenuIcon />
        </button>
      </header>

      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-60 md:translate-x-0 dark:border-zinc-800 dark:bg-zinc-900 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header sidebar */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
          <Link href="/admin" className="flex items-center gap-2" aria-label="TurnoExpress admin">
            <Image src="/Icono.png" alt="" width={331} height={277} className="h-7 w-auto" />
            <span className="text-base font-bold tracking-tight">
              <span className="text-zinc-900 dark:text-zinc-50">Turno</span>
              <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
                Express
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
            aria-label="Cerrar menú"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Tenant card */}
        <div className="mx-3 mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Negocio
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold">{tenantName}</p>
          <Link
            href={`/${tenantSlug}`}
            target="_blank"
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-sky-600 hover:underline dark:text-sky-400"
          >
            <span className="font-mono">/{tenantSlug}</span>
            <ExternalLinkIcon className="h-3 w-3" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group relative flex items-center gap-2.5 rounded-md px-3 py-2 transition ${
                      active
                        ? "bg-sky-50 font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-sky-500"
                        aria-hidden
                      />
                    )}
                    <span
                      className={
                        active
                          ? "text-sky-600 dark:text-sky-400"
                          : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                      }
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <form action={signOutAction} className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <LogoutIcon />
            Cerrar sesión
          </button>
        </form>
      </aside>
    </>
  );
}
