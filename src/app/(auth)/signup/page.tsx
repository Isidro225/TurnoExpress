"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "",
    slug: "",
    ownerName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos crear tu cuenta");
      setLoading(false);
      return;
    }
    const login = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      setError("Cuenta creada pero falló el login. Probá iniciar sesión.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold mb-1">Crear mi turnera</h1>
        <p className="text-sm text-zinc-500 mb-6">Tu negocio va a estar online en minutos.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nombre del negocio</label>
            <input
              required
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">URL personalizada</label>
            <div className="flex items-center rounded-md border border-zinc-300 dark:border-zinc-700">
              <span className="px-3 text-sm text-zinc-500">turnoexpress.com/</span>
              <input
                required
                value={form.slug}
                onChange={(e) => update("slug", e.target.value.toLowerCase())}
                placeholder="mi-negocio"
                className="flex-1 rounded-r-md px-2 py-2 dark:bg-zinc-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Tu nombre</label>
            <input
              required
              value={form.ownerName}
              onChange={(e) => update("ownerName", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-zinc-900 py-2 text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-zinc-900 underline dark:text-zinc-100">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
