import Image from "next/image";
import Link from "next/link";
import { CountUp } from "./_components/CountUp";
import { PhoneMockup } from "./_components/PhoneMockup";
import { Reveal } from "./_components/Reveal";
import { RotatingHeadline } from "./_components/RotatingHeadline";
import { ScrollFocusManager } from "./_components/ScrollFocusManager";
import { ThemeToggle } from "./_components/ThemeToggle";
import {
  BILLING_TRIAL_DAYS,
  type BillingPlanId,
  formatBillingPlanPrice,
} from "@/lib/billing-plans";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <ScrollFocusManager />
      <Nav />
      <FocusSection><Hero /></FocusSection>
      <FocusSection><TrustStrip /></FocusSection>
      <FocusSection><Features /></FocusSection>
      <FocusSection><AdminPreview /></FocusSection>
      <FocusSection><Industries /></FocusSection>
      <FocusSection><HowItWorks /></FocusSection>
      <FocusSection><Pricing /></FocusSection>
      <FocusSection><Faq /></FocusSection>
      <FocusSection><FinalCta /></FocusSection>
      <Footer />
    </div>
  );
}

function FocusSection({ children }: { children: React.ReactNode }) {
  return <div data-scroll-focus>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
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
        <nav className="hidden items-center gap-1 text-sm sm:flex">
          <a href="#planes" className="px-3 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Planes
          </a>
          <a href="#faq" className="px-3 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Preguntas
          </a>
          <ThemeToggle />
          <Link
            href="/login"
            className="px-3 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/signup?plan=pro"
            className="ml-1 rounded-md bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 font-medium text-white shadow-sm shadow-sky-500/25 transition hover:shadow-md hover:shadow-sky-500/40"
          >
            Crear mi turnera
          </Link>
        </nav>
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <details className="group relative">
            <summary
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 [&::-webkit-details-marker]:hidden"
              aria-label="Abrir menú"
            >
              <MenuIcon className="h-5 w-5 transition-transform duration-300 group-open:rotate-90" />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-menu-pop overflow-hidden rounded-xl border border-zinc-200 bg-white p-2 text-sm shadow-xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900">
              <Link
                href="/login"
                className="block rounded-lg px-3 py-2 text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup?plan=pro"
                className="mt-1 block rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-3 py-2 text-center font-medium text-white transition hover:opacity-90"
              >
                Crear mi turnera
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function MenuIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Fondo animado: gradient lento + blobs + grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 animate-gradient bg-gradient-to-br from-sky-100/70 via-white to-emerald-100/50 dark:from-sky-900/30 dark:via-zinc-950 dark:to-emerald-900/20" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-pattern"
        style={{
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-12 -z-10 h-72 w-72 animate-blob rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-700/30" />
      <div
        className="pointer-events-none absolute right-0 top-40 -z-10 h-72 w-72 animate-blob rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-700/20"
        style={{ animationDelay: "-4s" }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div className="mx-auto max-w-xl space-y-6 text-center md:mx-0">
          <h1
            className="animate-fade-in-up text-4xl font-semibold leading-tight tracking-tight md:text-5xl"
            style={{ animationDelay: "120ms" }}
          >
            Tu sistema de turnos online,{" "}
            <RotatingHeadline />
          </h1>
          <p
            className="animate-fade-in-up text-lg text-zinc-600 dark:text-zinc-400"
            style={{ animationDelay: "240ms" }}
          >
            Personalizá tu turnera con tu logo y colores, cobrá la seña con Mercado Pago
            y gestioná tu agenda desde un panel pensado para tu negocio.
          </p>
          <div
            className="flex animate-fade-in-up flex-wrap justify-center gap-3"
            style={{ animationDelay: "360ms" }}
          >
            <Link
              href="/signup?plan=pro"
              className="group relative overflow-hidden rounded-md bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-3 font-medium text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/40"
            >
              <span className="relative z-10">Empezar ahora</span>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <a
              href="#planes"
              className="rounded-md border border-zinc-300 px-5 py-3 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-sm dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Ver planes
            </a>
          </div>
          <div
            className="flex animate-fade-in-up flex-wrap items-center justify-center gap-6 pt-2 text-sm text-zinc-500"
            style={{ animationDelay: "480ms" }}
          >
            <Bullet>Sin comisión sobre tus señas</Bullet>
            <Bullet>Tu propia URL</Bullet>
          </div>
        </div>

        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="animate-float">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <CheckIcon className="h-4 w-4 text-emerald-600" />
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trust strip — barra de cifras / promesas debajo del hero
// ─────────────────────────────────────────────────────────────────────────────

function TrustStrip() {
  const stats: { key: string; value: React.ReactNode; label: string }[] = [
    {
      key: "min",
      value: (
        <>
          <CountUp to={5} /> min
        </>
      ),
      label: "para tener tu turnera lista",
    },
    { key: "fee", value: "0%", label: "de comisión sobre tus señas" },
    { key: "always", value: "24/7", label: "tus clientes reservan cuando quieran" },
  ];
  return (
    <section className="border-y border-zinc-200 bg-white/60 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Reveal key={s.key} delay={i * 80}>
            <div className="text-center sm:text-left">
              <p className="bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Features
// ─────────────────────────────────────────────────────────────────────────────

function Features() {
  const items: { title: string; body: string; icon: React.ReactNode }[] = [
    {
      title: "Tu propia URL",
      body: "Compartí turnoexpress.com/tu-negocio en redes, en tu bio o en WhatsApp.",
      icon: <LinkIcon />,
    },
    {
      title: "Cobrás la seña con Mercado Pago",
      body: "Cada negocio conecta su cuenta y recibe el dinero directo. Cero comisión nuestra.",
      icon: <DollarIcon />,
    },
    {
      title: "Calendario y estadísticas",
      body: "Vista semanal en escritorio, vista de día en el celular. KPIs en tiempo real.",
      icon: <CalendarIcon />,
    },
    {
      title: "Branding completo",
      body: "Subí tu logo, elegí tu color y los clientes lo ven aplicado en toda la reserva.",
      icon: <PaletteIcon />,
    },
    {
      title: "Profesional y horario",
      body: "Cargá tu equipo, sus servicios y horarios; el sistema arma la disponibilidad solo.",
      icon: <UsersIcon />,
    },
    {
      title: "Funciona en celular",
      body: "Diseño responsive: gestionás tus turnos desde el laburo o desde el subte.",
      icon: <PhoneIcon />,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Todo lo que necesitás para vender turnos
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Sin armar nada técnico. En 5 minutos tenés tu turnera online.
          </p>
        </div>
      </Reveal>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={i * 80}>
            <div className="group h-full rounded-xl border border-zinc-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-500/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-800">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-600 transition group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white dark:bg-sky-950 dark:text-sky-400">
                {it.icon}
              </div>
              <h3 className="font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{it.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminPreview — mockup del panel de administración
// ─────────────────────────────────────────────────────────────────────────────

function AdminPreview() {
  const week = ["Lun 12", "Mar 13", "Mié 14", "Jue 15", "Vie 16", "Sáb 17"];
  const appts = [
    { day: 0, start: 9, end: 10, name: "Martina G.", svc: "Color", color: "bg-rose-500/90" },
    { day: 1, start: 10, end: 11.5, name: "Luis P.", svc: "Corte + barba", color: "bg-sky-500/90" },
    { day: 1, start: 14, end: 15, name: "Ana R.", svc: "Manicura", color: "bg-pink-500/90" },
    { day: 2, start: 11, end: 12, name: "Joaquín M.", svc: "Corte", color: "bg-emerald-500/90" },
    { day: 3, start: 9.5, end: 10.5, name: "Romina F.", svc: "Brushing", color: "bg-violet-500/90" },
    { day: 3, start: 13, end: 14.5, name: "Pedro O.", svc: "Color + corte", color: "bg-amber-500/90" },
    { day: 4, start: 10, end: 11, name: "Sofía L.", svc: "Corte", color: "bg-sky-500/90" },
    { day: 5, start: 11, end: 13, name: "Belén S.", svc: "Color completo", color: "bg-rose-500/90" },
  ];
  const dayStart = 9;
  const dayHours = 8;

  return (
    <section className="relative overflow-hidden border-y border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div
        className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-72 w-72 -translate-y-1/2 animate-blob rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-700/15"
        style={{ animationDelay: "-3s" }}
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <div>
            <p className="mb-3 inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              Tu panel de control
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Toda tu agenda en una sola pantalla
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Vista semanal en escritorio, vista de día en el celular. Ves de un pantallazo qué
              profesional está libre, quién pagó la seña, y los huecos que podés llenar.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Confirmás, reasignás o cancelás turnos en un click.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Estado de pago de la seña visible al lado de cada turno.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>KPIs en tiempo real: ingresos, ocupación, ausencias.</span>
              </li>
            </ul>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] dark:border-zinc-800 dark:bg-zinc-950">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-100 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[11px] text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                  <span className="truncate font-mono">turnoexpress.com/admin</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 p-4 sm:p-5">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Hoy</p>
                  <p className="mt-1 text-lg font-bold">
                    <CountUp to={12} /> turnos
                  </p>
                  <p className="text-[10px] text-emerald-600">+18% vs. ayer</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Ingresos</p>
                  <p className="mt-1 text-lg font-bold">
                    $<CountUp to={148} />K
                  </p>
                  <p className="text-[10px] text-zinc-500">esta semana</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Ocupación</p>
                  <p className="mt-1 text-lg font-bold">
                    <CountUp to={82} />%
                  </p>
                  <p className="text-[10px] text-emerald-600">▲ 4 pts</p>
                </div>
              </div>

              {/* Calendar header */}
              <div className="grid grid-cols-[40px_repeat(6,1fr)] border-t border-zinc-200 bg-zinc-50 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="px-2 py-2" />
                {week.map((d) => (
                  <div key={d} className="border-l border-zinc-200 px-2 py-2 text-center dark:border-zinc-800">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="relative grid grid-cols-[40px_repeat(6,1fr)]">
                {/* Hours column */}
                <div className="border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  {Array.from({ length: dayHours }).map((_, i) => (
                    <div key={i} className="h-8 px-1 pt-0.5 text-right text-[9px] text-zinc-400">
                      {dayStart + i}h
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {week.map((_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="relative border-l border-zinc-200 dark:border-zinc-800"
                    style={{ height: `${dayHours * 32}px` }}
                  >
                    {Array.from({ length: dayHours }).map((__, i) => (
                      <div
                        key={i}
                        className="absolute inset-x-0 border-t border-dashed border-zinc-100 dark:border-zinc-800/60"
                        style={{ top: `${i * 32}px`, height: "32px" }}
                      />
                    ))}
                    {appts
                      .filter((a) => a.day === dayIdx)
                      .map((a, i) => (
                        <div
                          key={i}
                          className={`calendar-appt absolute inset-x-1 overflow-hidden rounded-md px-1.5 py-1 text-[9px] leading-tight text-white shadow-sm ${a.color}`}
                          style={{
                            top: `${(a.start - dayStart) * 32}px`,
                            height: `${(a.end - a.start) * 32}px`,
                            animationDelay: `${appts.indexOf(a) * 70}ms`,
                          }}
                        >
                          <p className="truncate font-semibold">{a.name}</p>
                          <p className="truncate opacity-90">{a.svc}</p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// How it works
// ─────────────────────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: "Creás tu cuenta",
      body: "Elegí el nombre de tu URL personalizada. Ya quedás listo para configurar tu turnera.",
    },
    {
      n: 2,
      title: "Cargás servicios y horarios",
      body: "Tus servicios, profesionales y el horario semanal de cada uno. Conectás Mercado Pago en un click.",
    },
    {
      n: 3,
      title: "Compartís tu link",
      body: "Tus clientes reservan, pagan la seña, y vos los ves aparecer en tu calendario.",
    },
  ];

  return (
    <section className="border-y border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Cómo funciona</h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">3 pasos y tus turnos online.</p>
          </div>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="group relative">
                <div
                  className="step-num-ping mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-lg font-semibold text-white shadow-md shadow-sky-500/30 transition group-hover:scale-110 group-hover:shadow-sky-500/50"
                  style={{ ["--ping-delay" as string]: `${i * 120 + 600}ms` }}
                >
                  {s.n}
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Industries — rubros que pueden usar TurnoExpress
// ─────────────────────────────────────────────────────────────────────────────

const INDUSTRY_COLORS: Record<string, string> = {
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
  pink: "bg-pink-100 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400",
};

function Industries() {
  const items: {
    name: string;
    desc: string;
    icon: React.ReactNode;
    color: keyof typeof INDUSTRY_COLORS;
  }[] = [
    {
      name: "Peluquerías y barberías",
      desc: "Cortes, color, peinados, barba",
      icon: <ScissorsIcon />,
      color: "rose",
    },
    {
      name: "Estética y uñas",
      desc: "Manicura, depilación, faciales",
      icon: <SparklesIcon />,
      color: "pink",
    },
    {
      name: "Salud y bienestar",
      desc: "Psicología, nutrición, kinesiología",
      icon: <HeartIcon />,
      color: "emerald",
    },
    {
      name: "Centros médicos",
      desc: "Consultas, controles, especialidades",
      icon: <MedicalIcon />,
      color: "sky",
    },
    {
      name: "Gimnasios y entrenadores",
      desc: "Clases y sesiones personalizadas",
      icon: <DumbbellIcon />,
      color: "amber",
    },
    {
      name: "Yoga y pilates",
      desc: "Clases grupales o individuales",
      icon: <LeafIcon />,
      color: "violet",
    },
    {
      name: "Tatuajes y piercings",
      desc: "Sesiones, diseños, retoques",
      icon: <DropIcon />,
      color: "slate",
    },
    {
      name: "Veterinarias",
      desc: "Consultas, vacunación, peluquería canina",
      icon: <PawIcon />,
      color: "orange",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-zinc-50 py-20 dark:bg-zinc-950">
      <div
        className="pointer-events-none absolute left-1/3 top-1/4 -z-10 h-72 w-72 animate-blob rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-700/10"
        style={{ animationDelay: "-2s" }}
      />
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Para todos los rubros que trabajan con turnos
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Si tu negocio depende de horarios y profesionales, TurnoExpress se adapta.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.name} delay={i * 60}>
              <div className="group h-full rounded-xl border border-zinc-200 bg-white p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-500/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-800">
                <div
                  className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:scale-110 group-hover:rotate-3 ${INDUSTRY_COLORS[it.color]}`}
                >
                  {it.icon}
                </div>
                <h3 className="text-sm font-semibold">{it.name}</h3>
                <p className="mt-1 text-xs text-zinc-500">{it.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-10 text-center text-sm text-zinc-500">
            …y cualquier otro servicio con turno: fotografía, talleres, escuelas de música, coaching.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing — 3 paquetes con pro y contras
// ─────────────────────────────────────────────────────────────────────────────

type Plan = {
  slug: BillingPlanId;
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  highlight?: boolean;
  features: string[];
  pros: string[];
  cons: string[];
  cta: string;
};

const PLANS: Plan[] = [
  {
    slug: "basic",
    name: "Básico",
    tagline: "Para empezar a tomar turnos sin invertir de más.",
    price: formatBillingPlanPrice("basic"),
    priceNote: "/mes",
    features: [
      "1 profesional",
      "Hasta 50 turnos por mes",
      "URL personalizada",
      "Mercado Pago integrado",
      "Soporte por email",
    ],
    pros: [
      "Ideal si trabajás solo",
      "Cobrás directo a tu MP, sin comisión nuestra",
      "Setup en 5 minutos",
    ],
    cons: [
      "Solo un profesional",
      "Sin notificaciones por email automáticas",
      "Sin estadísticas avanzadas",
    ],
    cta: "Probar Básico",
  },
  {
    slug: "pro",
    name: "Pro",
    tagline: "Para negocios establecidos con equipo y volumen.",
    price: formatBillingPlanPrice("pro"),
    priceNote: "/mes",
    highlight: true,
    features: [
      "Hasta 5 profesionales",
      "Turnos ilimitados",
      "Logo, color y branding completo",
      "Estadísticas y reportes",
      "Recordatorios por email",
      "Soporte prioritario",
    ],
    pros: [
      "El balance ideal para la mayoría de negocios",
      "Branding completo: tu marca en cada paso",
      "Recordatorios reducen ausencias",
    ],
    cons: [
      "Si tenés más de 5 profesionales necesitás Premium",
      "Sin multi-sucursal",
    ],
    cta: "Empezar con Pro",
  },
  {
    slug: "premium",
    name: "Premium",
    tagline: "Para centros, cadenas y operaciones grandes.",
    price: formatBillingPlanPrice("premium"),
    priceNote: "/mes",
    features: [
      "Profesionales ilimitados",
      "Multi-sucursal",
      "Onboarding 1 a 1",
      "API para integraciones",
      "Soporte dedicado",
    ],
    pros: [
      "Sin límites de equipo ni de turnos",
      "Te ayudamos a migrar y arrancar",
    ],
    cons: [
      "Pensado para volumen — si no lo necesitás, Pro alcanza",
      "Precio más alto",
    ],
    cta: "Contratar Premium",
  },
];

function Pricing() {
  return (
    <section id="planes" className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Elegí el plan que te queda</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Sin comisión sobre tus señas: el dinero va directo a tu Mercado Pago.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Precios sujetos a ajuste. Beta con descuento durante el lanzamiento.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.name} delay={i * 120}>
            <div
              className={`group relative flex h-full flex-col rounded-2xl border bg-white p-6 transition duration-300 hover:-translate-y-1 dark:bg-zinc-900 ${
                plan.highlight
                  ? "border-sky-500 shadow-lg shadow-sky-500/15 hover:shadow-2xl hover:shadow-sky-500/25 dark:border-sky-500"
                  : "border-zinc-200 hover:border-sky-300 hover:shadow-lg dark:border-zinc-800 dark:hover:border-sky-700"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 overflow-hidden rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-white">
                  <span className="relative z-10">Más elegido</span>
                  <span className="pointer-events-none absolute inset-0 animate-shimmer" />
                </span>
              )}

            <div className="mb-4">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{plan.tagline}</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
              <span className="text-sm text-zinc-500">{plan.priceNote}</span>
              <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {BILLING_TRIAL_DAYS} días de prueba gratis
              </p>
            </div>

            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Incluye
              </p>
              <ul className="space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-4">
              <div className="rounded-md bg-emerald-50 p-3 text-sm dark:bg-emerald-950/40">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Lo bueno
                </p>
                <ul className="space-y-1.5">
                  {plan.pros.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-emerald-900 dark:text-emerald-200">
                      <PlusIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md bg-amber-50 p-3 text-sm dark:bg-amber-950/40">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  A tener en cuenta
                </p>
                <ul className="space-y-1.5">
                  {plan.cons.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
                      <MinusIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link
              href={`/signup?plan=${plan.slug}`}
              className={`mt-auto block rounded-md py-2.5 text-center text-sm font-medium transition ${
                plan.highlight
                  ? "bg-sky-500 text-white hover:bg-sky-600 hover:shadow-md hover:shadow-sky-500/30"
                  : "border border-zinc-300 hover:border-sky-400 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
          </Reveal>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-zinc-500">
        Todos los planes incluyen: cobro de seña con Mercado Pago, calendario, panel admin, vista mobile y SSL.
      </p>

      <Reveal>
        <div className="mt-14 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Compará todo lo que incluye cada plan
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-zinc-500"> </th>
                  <th className="px-5 py-3 text-center font-semibold">Básico</th>
                  <th className="px-5 py-3 text-center font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      Pro
                      <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white">
                        Popular
                      </span>
                    </span>
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30">
                    <th scope="row" className="px-5 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                      {row.label}
                    </th>
                    <ComparisonCell value={row.basic} />
                    <ComparisonCell value={row.pro} highlight />
                    <ComparisonCell value={row.premium} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const COMPARISON_ROWS: { label: string; basic: string | boolean; pro: string | boolean; premium: string | boolean }[] = [
  { label: "URL personalizada", basic: true, pro: true, premium: true },
  { label: "Mercado Pago integrado (0% comisión)", basic: true, pro: true, premium: true },
  { label: "Profesionales", basic: "1", pro: "Hasta 5", premium: "Ilimitados" },
  { label: "Turnos por mes", basic: "Hasta 50", pro: "Ilimitados", premium: "Ilimitados" },
  { label: "Logo y color de marca", basic: true, pro: true, premium: true },
  { label: "Branding completo (tipografía, imagen)", basic: false, pro: true, premium: true },
  { label: "Recordatorios por email", basic: false, pro: true, premium: true },
  { label: "Estadísticas y reportes", basic: false, pro: true, premium: true },
  { label: "Multi-sucursal", basic: false, pro: false, premium: true },
  { label: "API para integraciones", basic: false, pro: false, premium: true },
  { label: "Onboarding 1 a 1", basic: false, pro: false, premium: true },
  { label: "Soporte", basic: "Email", pro: "Prioritario", premium: "Dedicado" },
];

function ComparisonCell({ value, highlight = false }: { value: string | boolean; highlight?: boolean }) {
  const base = "px-5 py-3 text-center";
  const cls = highlight ? `${base} bg-sky-50/50 dark:bg-sky-950/20` : base;
  if (value === true) {
    return (
      <td className={cls}>
        <CheckIcon className="mx-auto h-4 w-4 text-emerald-600" />
      </td>
    );
  }
  if (value === false) {
    return (
      <td className={cls}>
        <span className="mx-auto block h-px w-3 bg-zinc-300 dark:bg-zinc-700" />
      </td>
    );
  }
  return <td className={`${cls} font-medium`}>{value}</td>;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────

function Faq() {
  const items = [
    {
      q: "¿Cobran comisión sobre las señas?",
      a: "No. Cada negocio conecta su propia cuenta de Mercado Pago y recibe la seña directo. TurnoExpress solo cobra el abono mensual.",
    },
    {
      q: "¿Necesito tener cuenta de Mercado Pago?",
      a: "Sí. Es gratis crearla. Una vez que la tengas, la conectás desde el panel en un click (OAuth) o pegando tus credenciales.",
    },
    {
      q: "¿Puedo cancelar cuando quiera?",
      a: "Sí. No hay permanencia. Si te das de baja, tu turnera deja de tomar reservas pero conservamos tu data por 30 días por si querés volver.",
    },
    {
      q: "¿Puedo cambiar de plan?",
      a: "Sí, podés subir o bajar de plan en cualquier momento. El cambio se aplica al siguiente ciclo.",
    },
    {
      q: "¿Qué pasa si un cliente no se presenta?",
      a: "La seña queda para vos. Desde el panel marcás el turno como 'No se presentó' y queda registrado.",
    },
    {
      q: "¿Sirve para mi rubro?",
      a: "Funciona para peluquerías, estética, profesionales de la salud, gimnasios, talleres y servicios que dependen de turnos con horario y profesional.",
    },
  ];

  return (
    <section id="faq" className="border-t border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">
            Preguntas frecuentes
          </h2>
        </Reveal>
        <div className="space-y-3">
          {items.map((it, i) => (
            <Reveal key={it.q} delay={i * 60}>
              <details className="group rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-sky-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-800">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
                  {it.q}
                  <span className="text-zinc-400 transition duration-300 group-open:rotate-180 group-open:text-sky-500">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{it.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Final CTA + Footer
// ─────────────────────────────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="relative mx-auto max-w-4xl overflow-hidden px-6 py-20 text-center">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-blob rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-700/20"
      />
      <Reveal>
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Tus clientes ya están listos para reservar online.
        </h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Creá tu turnera ahora y activá tu plan con Mercado Pago.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/signup?plan=pro"
            className="group relative overflow-hidden rounded-md bg-sky-500 px-6 py-3 text-white shadow-lg shadow-sky-500/30 transition hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-sky-500/50"
          >
            <span className="relative z-10">Crear mi turnera</span>
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-zinc-300 px-6 py-3 transition hover:-translate-y-0.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-zinc-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} TurnoExpress. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4">
          <a href="#planes" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Planes
          </a>
          <a href="#faq" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Preguntas
          </a>
          <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Iconos (inline SVG, sin dependencias)
// ─────────────────────────────────────────────────────────────────────────────

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}
function MinusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M5 10a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" strokeLinecap="round" />
    </svg>
  );
}
function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <line x1="12" y1="3" x2="12" y2="21" strokeLinecap="round" />
      <path d="M16 7H10a3 3 0 1 0 0 6h4a3 3 0 1 1 0 6H8" strokeLinecap="round" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="7" strokeLinecap="round" />
    </svg>
  );
}
function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.5 1.5-1.5S13 18 13 17c0-1 1-1.5 2-1.5h2a4 4 0 0 0 4-4 8.5 8.5 0 0 0-9-8.5z" />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="9.5" cy="7.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 14.5a4.5 4.5 0 0 1 6 4" strokeLinecap="round" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <line x1="11" y1="18" x2="13" y2="18" strokeLinecap="round" />
    </svg>
  );
}

// Iconos para la sección de rubros
function ScissorsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="8.5" y1="8" x2="20" y2="20" />
      <line x1="8.5" y1="16" x2="20" y2="4" />
    </svg>
  );
}
function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 2.5l1.6 5.4L19 9.5l-5.4 1.6L12 16.5l-1.6-5.4L5 9.5l5.4-1.6z" />
      <path d="M19 14l.6 1.9 1.9.6-1.9.6L19 19l-.6-1.9-1.9-.6 1.9-.6z" />
      <path d="M5.5 15l.5 1.5 1.5.5-1.5.5L5.5 19 5 17.5l-1.5-.5L5 16.5z" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 21s-7-4.5-9.5-10C0 5.5 5 1.5 8 1.5c2 0 3 1 4 3 1-2 2-3 4-3 3 0 8 4 5.5 9.5C19 16.5 12 21 12 21z" />
    </svg>
  );
}
function MedicalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M4.8 2.3A.3.3 0 1 1 5 2H8a.2.2 0 0 1 .2.2v5.5a.2.2 0 0 1-.2.2H4.9a.2.2 0 0 1-.2-.2z" />
      <path d="M8 15a6 6 0 0 0 12 0v-3" />
      <path d="M11 3v9a4 4 0 0 0 8 0V3" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}
function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
      <path d="M6.5 6.5v11M3.5 9v6M6.5 12h11M17.5 6.5v11M20.5 9v6" />
    </svg>
  );
}
function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M11 20A7 7 0 0 1 4 13c0-7 6-11 17-11 0 11-4 17-11 17a7 7 0 0 1-6-3" />
      <path d="M2 22c2-7 6-12 13-15" />
    </svg>
  );
}
function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 2c-3.5 4.5-6.5 8.5-6.5 12.5a6.5 6.5 0 0013 0c0-4-3-8-6.5-12.5z" />
    </svg>
  );
}
function PawIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <ellipse cx="5" cy="11" rx="2" ry="2.6" />
      <ellipse cx="9" cy="6" rx="2" ry="2.6" />
      <ellipse cx="15" cy="6" rx="2" ry="2.6" />
      <ellipse cx="19" cy="11" rx="2" ry="2.6" />
      <path d="M12 13c-3 0-5.5 2-5.5 5 0 1.7 1.5 3 5.5 3s5.5-1.3 5.5-3c0-3-2.5-5-5.5-5z" />
    </svg>
  );
}
