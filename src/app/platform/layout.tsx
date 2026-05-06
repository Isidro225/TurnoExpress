import Image from "next/image";
import Link from "next/link";
import { isPlatformUnlocked } from "@/lib/platform-admin";
import { lockPlatformAction } from "./auth-actions";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const unlocked = await isPlatformUnlocked();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/platform" className="flex min-w-0 items-center gap-2" aria-label="TurnoExpress platform">
            <Image src="/Icono.png" alt="" width={331} height={277} priority className="h-8 w-auto" />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight sm:text-base">
                <span>Turno</span>
                <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
                  Express
                </span>
              </p>
              <p className="truncate text-[11px] text-zinc-500">Panel interno</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/admin"
              className="hidden rounded-md border border-zinc-300 px-3 py-2 text-zinc-700 transition hover:bg-zinc-100 sm:inline-flex dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Mi negocio
            </Link>
            {unlocked && (
              <form action={lockPlatformAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Bloquear
                </button>
              </form>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              Plataforma
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Planes y negocios</h1>
          </div>
          <p className="text-sm text-zinc-500">Acceso con contraseña</p>
        </div>
        {children}
      </main>
    </div>
  );
}
