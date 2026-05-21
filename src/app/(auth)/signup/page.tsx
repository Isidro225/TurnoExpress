import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import { normalizeBillingPlan } from "@/lib/billing-plans";
import { SignupExperience } from "./SignupExperience";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const sp = await searchParams;
  const initialPlan = normalizeBillingPlan(sp.plan);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Fondo decorativo (mismo lenguaje que el hero) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-gradient-to-br from-sky-100/70 via-white to-emerald-100/50 dark:from-sky-900/30 dark:via-zinc-950 dark:to-emerald-900/20" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-grid-pattern"
        style={{
          maskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-12 -z-10 h-72 w-72 animate-blob rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-700/30" />
      <div
        className="pointer-events-none absolute right-0 top-40 -z-10 h-72 w-72 animate-blob rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-700/20"
        style={{ animationDelay: "-4s" }}
      />

      <SignupNav />

      <section className="mx-auto max-w-6xl px-4 pt-10 text-center sm:px-6 sm:pt-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Activá tu turnera en{" "}
          <span className="bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent">
            5 minutos
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Completá los datos de tu negocio. Después conectás Mercado Pago y empezás a recibir
          reservas con seña.
        </p>
      </section>

      <SignupExperience initialPlan={initialPlan} />

      <SignupFooter />
    </div>
  );
}

function SignupNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center transition-transform hover:scale-[1.02]"
          aria-label="TurnoExpress"
        >
          <Image
            src="/Icono.png"
            alt=""
            width={331}
            height={277}
            priority
            className="h-10 w-auto sm:h-11"
            style={{ width: "auto" }}
          />
          <span className="ml-2.5 inline-block text-xl font-bold tracking-tight sm:text-2xl">
            <span className="text-zinc-900 dark:text-zinc-50">Turno</span>
            <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
              Express
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/#planes"
            className="hidden px-3 py-2 text-zinc-600 hover:text-zinc-900 sm:inline-block dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Ver planes
          </Link>
          <ThemeToggle />
          <Link
            href="/login"
            className="ml-1 rounded-md border border-zinc-300 px-3 py-2 text-zinc-700 transition hover:border-sky-400 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Iniciar sesión
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SignupFooter() {
  return (
    <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-zinc-500 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} TurnoExpress</p>
        <div className="flex items-center gap-4">
          <Link href="/#planes" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Planes
          </Link>
          <Link href="/#faq" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Preguntas
          </Link>
          <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </footer>
  );
}
