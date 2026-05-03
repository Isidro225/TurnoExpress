"use client";

import { useMemo, useState } from "react";

type StaffOption = { id: string; name: string };

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  defaultDate: string; // YYYY-MM-DD (en TZ del navegador)
  defaultTime: string; // HH:MM
  defaultStaffId: string;
  staffOptions: StaffOption[];
};

export function RescheduleForm({
  action,
  defaultDate,
  defaultTime,
  defaultStaffId,
  staffOptions,
}: Props) {
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [staffId, setStaffId] = useState(defaultStaffId);

  // El `datetime-local` no incluye TZ. Interpretamos en TZ del navegador y mandamos ISO UTC.
  const startsAtIso = useMemo(() => {
    if (!date || !time) return "";
    const d = new Date(`${date}T${time}`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [date, time]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="startsAt" value={startsAtIso} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block">Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block">Hora</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block">Profesional</span>
          <select
            name="staffId"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          >
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={!startsAtIso}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        Reagendar
      </button>
    </form>
  );
}
