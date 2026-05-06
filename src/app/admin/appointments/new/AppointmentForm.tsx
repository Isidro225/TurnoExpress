"use client";

import { useMemo, useState } from "react";

export type ServiceOption = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  staffIds: string[];
};

export type StaffOption = {
  id: string;
  name: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  services: ServiceOption[];
  staff: StaffOption[];
  defaultDate: string;
  defaultTime: string;
};

function priceLabel(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

export function AppointmentForm({
  action,
  services,
  staff,
  defaultDate,
  defaultTime,
}: Props) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const eligibleStaff = useMemo(() => {
    if (!selectedService) return [];
    const allowed = new Set(selectedService.staffIds);
    return staff.filter((s) => allowed.has(s.id));
  }, [staff, selectedService]);

  const [staffId, setStaffId] = useState(eligibleStaff[0]?.id ?? "");

  // Si cambia el servicio y el staff actual ya no es elegible, reseteamos.
  const validStaffId = eligibleStaff.some((s) => s.id === staffId)
    ? staffId
    : eligibleStaff[0]?.id ?? "";

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);

  const startsAtIso = useMemo(() => {
    if (!date || !time) return "";
    const d = new Date(`${date}T${time}`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [date, time]);

  const canSubmit = !!serviceId && !!validStaffId && !!startsAtIso;

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        Necesitás cargar al menos un servicio antes de poder crear turnos manualmente.
      </div>
    );
  }
  if (staff.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        Necesitás cargar al menos un profesional antes de poder crear turnos.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="startsAt" value={startsAtIso} />
      <input type="hidden" name="staffId" value={validStaffId} />

      <Section title="Servicio">
        <Field label="Servicio">
          <select
            name="serviceId"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              const next = services.find((s) => s.id === e.target.value);
              const allowed = new Set(next?.staffIds ?? []);
              if (!allowed.has(staffId)) {
                setStaffId(next?.staffIds[0] ?? "");
              }
            }}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMin}min · {priceLabel(s.priceCents)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Profesional">
          {eligibleStaff.length === 0 ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
              Ningún profesional tiene asignado este servicio. Asignalo desde la ficha del
              profesional.
            </p>
          ) : (
            <select
              value={validStaffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
            >
              {eligibleStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      </Section>

      <Section title="Cuándo">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </Field>
          <Field label="Hora">
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </Field>
        </div>
        {selectedService && (
          <p className="text-xs text-zinc-500">
            Duración del servicio: {selectedService.durationMin} min.
          </p>
        )}
      </Section>

      <Section title="Cliente">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <input
              name="customerName"
              required
              maxLength={120}
              placeholder="Juan Pérez"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </Field>
          <Field label="Email">
            <input
              name="customerEmail"
              type="email"
              required
              placeholder="cliente@email.com"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </Field>
          <Field label="Teléfono (opcional)">
            <input
              name="customerPhone"
              maxLength={40}
              placeholder="+54 11 ..."
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </Field>
          <Field label="Notas (opcional)">
            <input
              name="notes"
              maxLength={500}
              placeholder="Pidió producto X"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </Field>
        </div>
        <p className="text-xs text-zinc-500">
          Los turnos creados desde el admin quedan{" "}
          <span className="font-semibold">confirmados</span> automáticamente, sin cobro de seña.
        </p>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-500/25 transition hover:shadow-md hover:shadow-sky-500/40 disabled:opacity-60"
        >
          Crear turno
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
