"use client";

import { useEffect, useRef, useState } from "react";

type Match = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

type Customer = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

type Props = {
  value: Customer;
  onChange: (next: Customer) => void;
};

const INPUT_CLS =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800";

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function CustomerAutocomplete({ value, onChange }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeField, setActiveField] = useState<"name" | "phone" | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Búsqueda con debounce sobre el campo activo (nombre o teléfono).
  useEffect(() => {
    const raw = activeField === "phone" ? value.phone : activeField === "name" ? value.name : "";
    const q = raw.trim();
    if (!q || q.length < 2) {
      setMatches([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/customers/search?q=${encodeURIComponent(q)}`,
          { cache: "no-store" }
        );
        if (cancelled) return;
        if (!res.ok) {
          setMatches([]);
          setSearched(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setMatches(data.customers ?? []);
        setSearched(true);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setMatches([]);
          setSearched(true);
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [value.name, value.phone, activeField]);

  // Cerrar dropdown al hacer click afuera.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(match: Match) {
    onChange({
      name: match.name,
      email: match.email ?? "",
      phone: formatPhone(match.phone),
      notes: value.notes,
    });
    setOpen(false);
    setActiveField(null);
  }

  const showDropdown =
    open &&
    activeField !== null &&
    (loading ||
      matches.length > 0 ||
      (searched &&
        ((activeField === "name" && value.name.trim().length >= 2) ||
          (activeField === "phone" && value.phone.trim().length >= 2))));

  return (
    <div className="space-y-4" ref={wrapperRef}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <div className="relative">
            <input
              name="customerName"
              required
              maxLength={120}
              placeholder="Juan Pérez"
              autoComplete="off"
              value={value.name}
              onChange={(e) => {
                onChange({ ...value, name: e.target.value });
                setActiveField("name");
                setOpen(true);
              }}
              onFocus={() => {
                setActiveField("name");
                setOpen(true);
              }}
              className={INPUT_CLS}
            />
            {showDropdown && activeField === "name" && (
              <Dropdown matches={matches} loading={loading} onPick={pick} />
            )}
          </div>
        </Field>
        <Field label="Email">
          <input
            name="customerEmail"
            type="email"
            required
            placeholder="cliente@email.com"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field
          label="Teléfono"
          hint="Agrupamos los turnos por número, así podés ver el historial."
        >
          <div className="relative">
            <input
              name="customerPhone"
              required
              maxLength={40}
              placeholder="11 1234-5678"
              autoComplete="off"
              value={value.phone}
              onChange={(e) => {
                onChange({ ...value, phone: e.target.value });
                setActiveField("phone");
                setOpen(true);
              }}
              onFocus={() => {
                setActiveField("phone");
                setOpen(true);
              }}
              className={INPUT_CLS}
            />
            {showDropdown && activeField === "phone" && (
              <Dropdown matches={matches} loading={loading} onPick={pick} />
            )}
          </div>
        </Field>
        <Field label="Notas (opcional)">
          <input
            name="notes"
            maxLength={500}
            placeholder="Pidió producto X"
            value={value.notes}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
      </div>
    </div>
  );
}

function Dropdown({
  matches,
  loading,
  onPick,
}: {
  matches: Match[];
  loading: boolean;
  onPick: (m: Match) => void;
}) {
  return (
    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      {loading && matches.length === 0 ? (
        <p className="px-3 py-2 text-xs text-zinc-500">Buscando…</p>
      ) : matches.length === 0 ? (
        <p className="px-3 py-2 text-xs text-zinc-500">
          Sin coincidencias. Cargá un cliente nuevo completando los datos.
        </p>
      ) : (
        <ul>
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(m)}
                className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {formatPhone(m.phone)}
                    {m.email && <> · {m.email}</>}
                  </p>
                </div>
                <span className="shrink-0 self-center text-[10px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  usar
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}
