"use client";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  label?: string;
  className?: string;
};

export function ConfirmDeleteForm({
  action,
  message,
  label = "Borrar",
  className = "",
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }}
      className={className}
    >
      <button
        type="submit"
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        {label}
      </button>
    </form>
  );
}
