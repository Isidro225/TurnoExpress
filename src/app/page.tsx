import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">TurnoExpress</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
            >
              Crear mi turnera
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-24">
        <section className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Tu sistema de turnos online, listo en minutos.
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Personalizá tu turnera, cobrá la seña con Mercado Pago y gestioná tu agenda
              desde un panel pensado para tu negocio.
            </p>
            <div className="flex gap-3">
              <Link
                href="/signup"
                className="rounded-md bg-zinc-900 px-5 py-3 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
              >
                Empezar gratis
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-5 py-3 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <ul className="space-y-3 text-sm">
              <li>✓ Reserva con elección de profesional, día y horario</li>
              <li>✓ Seña automática vía Mercado Pago</li>
              <li>✓ Calendario y estadísticas para el admin</li>
              <li>✓ Tu propia URL: turnoexpress.com/tu-negocio</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
