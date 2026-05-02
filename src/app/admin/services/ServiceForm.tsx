import Link from "next/link";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initial?: {
    name: string;
    description: string | null;
    durationMin: number;
    priceCents: number;
    depositPct: number | null;
    active: boolean;
  };
  submitLabel: string;
};

export function ServiceForm({ action, initial, submitLabel }: Props) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <Field label="Nombre">
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </Field>
      <Field label="Descripción">
        <textarea
          name="description"
          rows={2}
          defaultValue={initial?.description ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Duración (min)">
          <input
            name="durationMin"
            type="number"
            min={5}
            step={5}
            required
            defaultValue={initial?.durationMin ?? 30}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </Field>
        <Field label="Precio (ARS)">
          <input
            name="priceArs"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={initial ? (initial.priceCents / 100).toFixed(2) : ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </Field>
        <Field label="Seña % (opcional)">
          <input
            name="depositPct"
            type="number"
            min={0}
            max={100}
            placeholder="usa el del negocio"
            defaultValue={initial?.depositPct ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          name="active"
          type="checkbox"
          defaultChecked={initial?.active ?? true}
        />
        Activo
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          {submitLabel}
        </button>
        <Link
          href="/admin/services"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancelar
        </Link>
      </div>
    </form>
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
