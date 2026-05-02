import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateSettings, disconnectMercadoPago } from "./actions";

const MP_BANNERS: Record<string, { tone: "ok" | "err"; text: string }> = {
  connected: { tone: "ok", text: "Mercado Pago conectado correctamente." },
  error: { tone: "err", text: "Mercado Pago canceló la conexión." },
  "missing-code": { tone: "err", text: "Faltan datos en la respuesta de Mercado Pago." },
  "invalid-state": { tone: "err", text: "El estado de OAuth no es válido (probá de nuevo)." },
  "server-misconfigured": { tone: "err", text: "OAuth de MP no está configurado en el servidor." },
  "exchange-failed": { tone: "err", text: "No pudimos canjear el código con Mercado Pago." },
};

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
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          {tenant.mpAccessToken ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-emerald-600">Cuenta conectada</p>
                <p className="text-sm text-zinc-500">
                  Las señas se cobran a tu cuenta de Mercado Pago.
                </p>
              </div>
              <form action={disconnectMercadoPago}>
                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                >
                  Desconectar
                </button>
              </form>
            </div>
          ) : oauthConfigured ? (
            <div>
              <p className="mb-1 font-medium">Conectá tu cuenta</p>
              <p className="text-sm text-zinc-500 mb-4">
                Usamos OAuth oficial de Mercado Pago. No guardamos tu clave.
              </p>
              <a
                href="/api/mercadopago/oauth/connect"
                className="inline-block rounded-md bg-[#009ee3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0086c4]"
              >
                Conectar Mercado Pago
              </a>
            </div>
          ) : (
            <div>
              <p className="mb-1 font-medium">OAuth no está configurado</p>
              <p className="text-sm text-zinc-500">
                Configurá <code>MP_OAUTH_CLIENT_ID</code> y{" "}
                <code>MP_OAUTH_CLIENT_SECRET</code> en las variables de entorno
                para habilitar la conexión por OAuth.
              </p>
            </div>
          )}
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
