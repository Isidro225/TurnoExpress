"use client";

import { useEffect, useMemo, useState } from "react";

type StaffOption = { id: string; name: string };
type Slot = { startsAt: string; endsAt: string };
type StaffAvailability = { staffId: string; staffName: string; slots: Slot[] };

type Props = {
  tenantSlug: string;
  serviceId: string;
  serviceName: string;
  durationMin: number;
  priceCents: number;
  mpEnabled: boolean;
  staffOptions: StaffOption[];
};

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function BookingFlow(props: Props) {
  const [staffId, setStaffId] = useState<string>(""); // "" = cualquiera
  const [date, setDate] = useState<string>(todayISO());
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ staffId: string; startsAt: string } | null>(null);

  const [customer, setCustomer] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setSelectedSlot(null);
      const params = new URLSearchParams({
        tenant: props.tenantSlug,
        service: props.serviceId,
        date,
      });
      if (staffId) params.set("staff", staffId);
      const res = await fetch(`/api/availability?${params.toString()}`);
      if (cancelled) return;
      if (!res.ok) {
        setAvailability([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAvailability(data.availability ?? []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [props.tenantSlug, props.serviceId, date, staffId]);

  const filtered = useMemo(() => {
    if (!staffId) return availability;
    return availability.filter((a) => a.staffId === staffId);
  }, [availability, staffId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantSlug: props.tenantSlug,
        serviceId: props.serviceId,
        staffId: selectedSlot.staffId,
        startsAt: selectedSlot.startsAt,
        ...customer,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No pudimos confirmar la reserva.");
      setSubmitting(false);
      return;
    }
    window.location.href = data.initPoint;
  }

  if (!props.mpEnabled) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        El negocio aún no conectó Mercado Pago. No se pueden recibir reservas todavía.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          1. Elegí día y profesional
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block">Fecha</span>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Profesional</span>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="">Cualquiera</option>
              {props.staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          2. Elegí horario
        </h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Buscando horarios...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No hay disponibilidad para esa fecha. Probá con otro día.
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => (
              <div key={a.staffId}>
                <p className="mb-2 text-sm font-medium">{a.staffName}</p>
                <div className="flex flex-wrap gap-2">
                  {a.slots.map((slot) => {
                    const time = new Date(slot.startsAt).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const isSelected =
                      selectedSlot?.staffId === a.staffId &&
                      selectedSlot.startsAt === slot.startsAt;
                    return (
                      <button
                        key={`${a.staffId}-${slot.startsAt}`}
                        type="button"
                        onClick={() =>
                          setSelectedSlot({ staffId: a.staffId, startsAt: slot.startsAt })
                        }
                        className={`rounded-md border px-3 py-1.5 text-sm ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                            : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedSlot && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            3. Tus datos
          </h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Nombre y apellido"
                value={customer.customerName}
                onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={customer.customerEmail}
                onChange={(e) => setCustomer({ ...customer, customerEmail: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <input
              placeholder="Teléfono (opcional)"
              value={customer.customerPhone}
              onChange={(e) => setCustomer({ ...customer, customerPhone: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <textarea
              placeholder="Notas (opcional)"
              value={customer.notes}
              onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              rows={2}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-zinc-900 py-2 text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
            >
              {submitting ? "Procesando..." : "Pagar seña y confirmar turno"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
