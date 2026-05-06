import Link from "next/link";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initial?: {
    name: string;
    removalMin: number;
    active: boolean;
  };
  submitLabel: string;
};

export function PriorServiceForm({ action, initial, submitLabel }: Props) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <Field label="Nombre">
        <input
          name="name"
          required
          placeholder="Ej: Esculpidas, Soft gel, Kapping..."
          defaultValue={initial?.name ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </Field>
      <Field label="Tiempo de retiro (min)">
        <input
          name="removalMin"
          type="number"
          min={5}
          step={5}
          required
          defaultValue={initial?.removalMin ?? 30}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        />
        <span className="mt-1 block text-xs text-zinc-500">
          Cuánto tarda en retirar este servicio. Se suma al turno cuando la cliente elige modo &quot;retiro&quot;.
        </span>
      </Field>
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
          href="/admin/services/prior"
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
