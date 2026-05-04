"use client";

import { useState } from "react";
import { CheckIcon } from "./AdminIcons";

const PRESETS = [
  { name: "Sky", value: "#0ea5e9" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Zinc", value: "#52525b" },
];

type Props = {
  name: string;
  defaultValue?: string | null;
};

export function ColorPicker({ name, defaultValue }: Props) {
  const [value, setValue] = useState(defaultValue ?? "#0ea5e9");

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => {
          const selected = p.value.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => setValue(p.value)}
              aria-label={p.name}
              title={p.name}
              className={`relative h-9 w-9 rounded-full transition hover:scale-110 ${
                selected
                  ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-900"
                  : "ring-1 ring-zinc-200 dark:ring-zinc-700"
              }`}
              style={{ backgroundColor: p.value }}
            >
              {selected && (
                <CheckIcon className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
          <input
            type="color"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent"
            aria-label="Color personalizado"
          />
          <span className="font-mono text-xs uppercase text-zinc-600 dark:text-zinc-400">
            {value}
          </span>
        </div>
        <span className="text-xs text-zinc-500">o elegí uno personalizado</span>
      </div>
    </div>
  );
}
