import Link from "next/link";
import { isPlatformPasswordConfigured } from "@/lib/platform-admin";
import { unlockPlatformAction } from "../auth-actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Contraseña incorrecta.",
  "missing-config": "Falta configurar PLATFORM_ADMIN_PASSWORD en el servidor.",
};

export default async function PlatformLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const configured = isPlatformPasswordConfigured();
  const error = sp.error ? ERROR_MESSAGES[sp.error] : null;

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md items-center">
      <section className="w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            Panel interno
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Ingresar contraseña</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Este acceso desbloquea la administración de planes y negocios asociados.
          </p>
        </div>

        {!configured ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            Configurá <code className="font-mono">PLATFORM_ADMIN_PASSWORD</code> en el servidor
            para habilitar este panel.
          </div>
        ) : (
          <form action={unlockPlatformAction} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Contraseña</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            >
              Entrar
            </button>
          </form>
        )}

        <Link
          href="/"
          className="mt-4 inline-flex text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Volver al inicio
        </Link>
      </section>
    </div>
  );
}
