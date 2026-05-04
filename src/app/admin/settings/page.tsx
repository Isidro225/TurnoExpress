import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  updateSettings,
  disconnectMercadoPago,
  updateMpCredentials,
  verifyMpCredentials,
} from "./actions";
import { LogoUpload } from "./LogoUpload";
import { MercadoPagoForm } from "./MercadoPagoForm";
import { PageHeader } from "../_components/PageHeader";
import { ColorPicker } from "../_components/ColorPicker";
import { CheckIcon } from "../_components/AdminIcons";

const MP_BANNERS: Record<string, { tone: "ok" | "err"; text: string }> = {
  connected: { tone: "ok", text: "Mercado Pago conectado correctamente." },
  saved: { tone: "ok", text: "Credenciales de Mercado Pago guardadas." },
  verified: { tone: "ok", text: "Conexión verificada con Mercado Pago." },
  disconnected: { tone: "ok", text: "Mercado Pago desconectado." },
  error: { tone: "err", text: "Mercado Pago canceló la conexión." },
  "missing-code": { tone: "err", text: "Faltan datos en la respuesta de Mercado Pago." },
  "invalid-state": { tone: "err", text: "El estado de OAuth no es válido (probá de nuevo)." },
  "server-misconfigured": { tone: "err", text: "OAuth de MP no está configurado en el servidor." },
  "exchange-failed": { tone: "err", text: "No pudimos canjear el código con Mercado Pago." },
  "bad-format": { tone: "err", text: "Formato de credenciales inválido. Revisá el access token." },
  "no-token": { tone: "err", text: "Todavía no cargaste credenciales." },
  "verify-failed": {
    tone: "err",
    text: "Mercado Pago rechazó el token. Probá generarlo de nuevo.",
  },
};

function maskToken(token: string): string {
  if (token.length <= 8) return "•••";
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ mp?: string }>;
}) {
  const session = await auth();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session!.user.tenantId! },
  });
  if (!tenant) return null;

  const oauthConfigured = !!process.env.MP_OAUTH_CLIENT_ID;
  const sp = await searchParams;
  const banner = sp.mp ? MP_BANNERS[sp.mp] : undefined;
  const isConnected = !!tenant.mpAccessToken;

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Configuración"
        description="Personalizá tu turnera y conectá tu cuenta de Mercado Pago."
      />

      {banner && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            banner.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              banner.tone === "ok" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {banner.tone === "ok" ? (
              <CheckIcon className="h-3 w-3" />
            ) : (
              <span className="text-xs font-bold">!</span>
            )}
          </span>
          <p>{banner.text}</p>
        </div>
      )}

      {/* Datos del negocio */}
      <Section
        title="Datos del negocio"
        description="Aparecen en la página pública donde tus clientes reservan."
      >
        <form action={updateSettings} className="space-y-5">
          <Field label="Nombre del negocio">
            <input
              name="name"
              required
              defaultValue={tenant.name}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </Field>
          <Field label="Descripción" hint="Una línea corta que aparece debajo del nombre.">
            <textarea
              name="description"
              rows={2}
              defaultValue={tenant.description ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </Field>
          <Field label="Logo">
            <LogoUpload defaultValue={tenant.logoUrl} />
          </Field>
          <Field label="Color principal" hint="Acento que se aplica a botones y chips de tu turnera.">
            <ColorPicker name="primaryColor" defaultValue={tenant.primaryColor} />
          </Field>
          <Field
            label="% de seña por defecto"
            hint="Podés sobrescribirlo por servicio."
          >
            <div className="relative w-32">
              <input
                name="depositPct"
                type="number"
                min={0}
                max={100}
                defaultValue={tenant.depositPct}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-7 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                %
              </span>
            </div>
          </Field>

          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              URL pública
            </p>
            <p className="mt-1 font-mono text-sm">turnoexpress.com/{tenant.slug}</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-500/25 transition hover:shadow-md hover:shadow-sky-500/40"
            >
              <CheckIcon className="h-4 w-4" />
              Guardar cambios
            </button>
          </div>
        </form>
      </Section>

      {/* Mercado Pago */}
      <Section
        title="Mercado Pago"
        description="Cada negocio cobra a su propia cuenta. La seña va directo a tu MP, sin pasar por nosotros."
        icon={<MpIcon />}
      >
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckIcon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="font-medium text-emerald-900 dark:text-emerald-200">
                  Cuenta conectada
                </p>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  Token: <span className="font-mono">{maskToken(tenant.mpAccessToken!)}</span>
                  {tenant.mpAccessToken!.startsWith("TEST-") && (
                    <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Sandbox
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                  {tenant.mpPublicKey ? "Public key configurada" : "Sin public key"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={verifyMpCredentials}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Probar conexión
                </button>
              </form>
              <form action={disconnectMercadoPago}>
                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Desconectar
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {oauthConfigured ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- navega a un route handler que redirige a Mercado Pago */}
                <a
                  href="/api/mercadopago/oauth/connect"
                  className="inline-flex items-center gap-2 rounded-md bg-[#009ee3] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0086c4]"
                >
                  <MpIcon className="h-4 w-4" />
                  Conectar con Mercado Pago
                </a>
                <p className="mt-2 text-xs text-zinc-500">
                  Te lleva al login de Mercado Pago y volvés acá automáticamente.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                OAuth no está habilitado en el servidor. Configurá{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">MP_OAUTH_CLIENT_ID</code> y{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">MP_OAUTH_CLIENT_SECRET</code>{" "}
                para habilitarlo, o usá la entrada manual de abajo.
              </div>
            )}
          </div>
        )}

        <details
          className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800"
          open={!isConnected}
        >
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
            {isConnected ? "Reemplazar credenciales manualmente" : "Conectar manualmente"}
          </summary>
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
            <MercadoPagoForm
              action={updateMpCredentials}
              hasPublicKey={!!tenant.mpPublicKey}
            />
          </div>
        </details>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-emerald-100 text-sky-600 dark:from-sky-950/60 dark:to-emerald-950/60 dark:text-sky-300">
              {icon}
            </span>
          )}
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function MpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 8.5C3 6.5 5 5 7.5 5h9C19 5 21 6.5 21 8.5v7c0 2-2 3.5-4.5 3.5h-9C5 19 3 17.5 3 15.5v-7zm10.5 6c2.2 0 4-1.5 4-3.5s-1.8-3.5-4-3.5-4 1.5-4 3.5 1.8 3.5 4 3.5z" />
    </svg>
  );
}
