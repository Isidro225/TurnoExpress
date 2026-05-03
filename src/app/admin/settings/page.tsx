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
    <div className="max-w-2xl space-y-10">
      {banner && (
        <div
          className={`rounded-md border p-3 text-sm ${
            banner.tone === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold mb-6">Configuración</h1>
        <form action={updateSettings} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Field label="Nombre del negocio">
            <input
              name="name"
              required
              defaultValue={tenant.name}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </Field>
          <Field label="Descripción">
            <textarea
              name="description"
              rows={2}
              defaultValue={tenant.description ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </Field>
          <LogoUpload defaultValue={tenant.logoUrl} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Color principal">
              <input
                name="primaryColor"
                type="color"
                defaultValue={tenant.primaryColor ?? "#0ea5e9"}
                className="h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-700"
              />
            </Field>
            <Field label="% de seña por defecto">
              <input
                name="depositPct"
                type="number"
                min={0}
                max={100}
                defaultValue={tenant.depositPct}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm">Color de fondo</legend>
            <div className="flex gap-3">
              {[
                { value: "white", label: "Blanco", swatch: "#ffffff", border: true },
                { value: "gray", label: "Gris", swatch: "#e4e4e7" },
                { value: "black", label: "Negro", swatch: "#09090b" },
              ].map((opt) => {
                const current = tenant.backgroundColor ?? "white";
                return (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="backgroundColor"
                      value={opt.value}
                      defaultChecked={current === opt.value}
                      className="peer sr-only"
                    />
                    <div className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-transparent p-2 transition peer-checked:border-sky-500 peer-checked:ring-2 peer-checked:ring-sky-500/25">
                      <span
                        className={`block h-12 w-12 rounded-md ${opt.border ? "border border-zinc-200" : ""}`}
                        style={{ backgroundColor: opt.swatch }}
                      />
                      <span className="text-xs">{opt.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Si elegís negro, los textos y las cards de la turnera pública se adaptan
              automáticamente al modo oscuro.
            </p>
          </fieldset>
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">URL pública</p>
            <p className="mt-1 font-mono text-sm">/{tenant.slug}</p>
          </div>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
          >
            Guardar cambios
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Mercado Pago</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Cada negocio cobra a su propia cuenta de Mercado Pago. Conectalo por OAuth
          (recomendado) o pegando tus credenciales.
        </p>
        <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          {isConnected ? (
            <div className="space-y-2">
              <p className="font-medium text-emerald-600">Cuenta conectada</p>
              <p className="text-xs text-zinc-500">
                Token: <span className="font-mono">{maskToken(tenant.mpAccessToken!)}</span>
                {tenant.mpAccessToken!.startsWith("TEST-") && " · modo sandbox"}
                {tenant.mpPublicKey ? " · public key configurada" : " · sin public key"}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <form action={verifyMpCredentials}>
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Probar conexión
                  </button>
                </form>
                <form action={disconnectMercadoPago}>
                  <button
                    type="submit"
                    className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
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
                  <a
                    href="/api/mercadopago/oauth/connect"
                    className="inline-block rounded-md bg-[#009ee3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0086c4]"
                  >
                    Conectar con Mercado Pago (OAuth)
                  </a>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  OAuth no está habilitado en el servidor. Configurá{" "}
                  <code>MP_OAUTH_CLIENT_ID</code> y <code>MP_OAUTH_CLIENT_SECRET</code> para
                  habilitarlo, o usá la entrada manual de abajo.
                </p>
              )}
            </div>
          )}

          <details className="border-t border-zinc-200 pt-4 dark:border-zinc-800" open={!isConnected}>
            <summary className="cursor-pointer text-sm font-medium">
              {isConnected ? "Reemplazar credenciales manualmente" : "Conectar manualmente"}
            </summary>
            <div className="mt-3">
              <MercadoPagoForm
                action={updateMpCredentials}
                hasPublicKey={!!tenant.mpPublicKey}
              />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}
