import Link from "next/link";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initial?: {
    name: string;
    email: string | null;
    phone: string | null;
    bio: string | null;
    active: boolean;
  };
  submitLabel: string;
};

export function StaffForm({ action, initial, submitLabel }: Props) {
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={initial?.email ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </Field>
        <Field label="Teléfono">
          <input
            name="phone"
            defaultValue={initial?.phone ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </Field>
      </div>
      <Field label="Bio">
        <textarea
          name="bio"
          rows={2}
          defaultValue={initial?.bio ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input name="active" type="checkbox" defaultChecked={initial?.active ?? true} />
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
          href="/admin/staff"
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
