"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  hasPublicKey: boolean;
};

export function MercadoPagoForm({ action, hasPublicKey }: Props) {
  const [showToken, setShowToken] = useState(false);

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block">Access token</span>
        <div className="relative">
          <input
            name="accessToken"
            type={showToken ? "text" : "password"}
            required
            placeholder="APP_USR-... o TEST-..."
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 pr-20 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="button"
            onClick={() => setShowToken((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs underline"
          >
            {showToken ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block">
          Public key{" "}
          <span className="text-xs text-zinc-500">
            (opcional{hasPublicKey ? " · ya tenés una guardada" : ""})
          </span>
        </span>
        <input
          name="publicKey"
          placeholder="APP_USR-... o TEST-..."
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      <p className="text-xs text-zinc-500">
        Conseguí tus credenciales en{" "}
        <a
          href="https://www.mercadopago.com.ar/developers/panel/app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          el panel de Mercado Pago
        </a>
        . Usá las de <strong>producción</strong> para cobrar real, o las de <strong>test</strong>{" "}
        para probar.
      </p>
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
      >
        Guardar credenciales
      </button>
    </form>
  );
}
