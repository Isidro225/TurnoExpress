"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type RangeKey = "today" | "7d" | "month" | "30d";

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "month", label: "Mes" },
  { key: "30d", label: "30 días" },
];

export function RangeSelector({ current }: { current: RangeKey }) {
  const router = useRouter();
  const sp = useSearchParams();

  const onSelect = (key: RangeKey) => {
    const next = new URLSearchParams(sp.toString());
    if (key === "month") next.delete("range");
    else next.set("range", key);
    const qs = next.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
  };

  return (
    <div
      role="tablist"
      aria-label="Rango de tiempo"
      className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 text-xs dark:border-zinc-800 dark:bg-zinc-900"
    >
      {OPTIONS.map((opt) => {
        const active = opt.key === current;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(opt.key)}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              active
                ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
