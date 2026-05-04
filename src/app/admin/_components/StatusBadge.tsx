type Status =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const STATUS_CFG: Record<
  Status,
  { label: string; cls: string; dot: string }
> = {
  PENDING_PAYMENT: {
    label: "Pendiente",
    cls: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    label: "Confirmado",
    cls: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  COMPLETED: {
    label: "Completado",
    cls: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700",
    dot: "bg-zinc-500",
  },
  CANCELLED: {
    label: "Cancelado",
    cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
    dot: "bg-red-500",
  },
  NO_SHOW: {
    label: "No vino",
    cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
    dot: "bg-red-500",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as Status] ?? {
    label: status,
    cls: "bg-zinc-100 text-zinc-700 border-zinc-200",
    dot: "bg-zinc-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden />
      {cfg.label}
    </span>
  );
}
