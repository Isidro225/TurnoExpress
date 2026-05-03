"use client";

import { useEffect, useMemo, useState } from "react";

type StaffOption = { id: string; name: string };

type ServiceForFlow = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
  depositPct: number;
  staff: StaffOption[];
};

type Slot = { startsAt: string; endsAt: string };
type StaffAvailability = { staffId: string; staffName: string; slots: Slot[] };

type Props = {
  tenantSlug: string;
  mpEnabled: boolean;
  services: ServiceForFlow[];
  initialServiceId: string | null;
};

const SLOT_SEP = "::"; // separador en value del <option>: staffId::ISO

const INPUT_CLS =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPriceArs(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

export function BookingFlow(props: Props) {
  const initial = props.services.find((s) => s.id === props.initialServiceId) ?? null;
  const [serviceId, setServiceId] = useState<string>(initial?.id ?? "");

  const service = useMemo(
    () => props.services.find((s) => s.id === serviceId) ?? null,
    [props.services, serviceId]
  );
  const multiStaff = (service?.staff.length ?? 0) > 1;

  const [staffFilter, setStaffFilter] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotKey, setSlotKey] = useState<string>("");

  const [customer, setCustomer] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset filtros y slot cuando cambia el servicio
  useEffect(() => {
    setStaffFilter("");
    setSlotKey("");
  }, [serviceId]);

  // Reset slot cuando cambia profesional o fecha
  useEffect(() => {
    setSlotKey("");
  }, [staffFilter, date]);

  // Cargar disponibilidad
  useEffect(() => {
    if (!service) {
      setAvailability([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingSlots(true);
      const params = new URLSearchParams({
        tenant: props.tenantSlug,
        service: service!.id,
        date,
      });
      if (staffFilter) params.set("staff", staffFilter);
      const res = await fetch(`/api/availability?${params}`);
      if (cancelled) return;
      if (!res.ok) {
        setAvailability([]);
        setLoadingSlots(false);
        return;
      }
      const data = await res.json();
      setAvailability(data.availability ?? []);
      setLoadingSlots(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [props.tenantSlug, service, date, staffFilter]);

  const selectedSlot = useMemo(() => {
    if (!slotKey) return null;
    const sep = slotKey.indexOf(SLOT_SEP);
    if (sep < 0) return null;
    return {
      staffId: slotKey.slice(0, sep),
      startsAt: slotKey.slice(sep + SLOT_SEP.length),
    };
  }, [slotKey]);

  const totalSlots = availability.reduce((acc, a) => acc + a.slots.length, 0);
  // Un solo staff visible si el servicio tiene uno o si filtramos por uno específico.
  const singleStaffMode = !multiStaff || !!staffFilter;

  const depositPreview = service
    ? Math.max(100, Math.round((service.priceCents * service.depositPct) / 100))
    : 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantSlug: props.tenantSlug,
        serviceId: service.id,
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
    <form onSubmit={onSubmit} className="space-y-5">
      <Section step={1} title="Tu turno">
        <div className="space-y-3">
          <Field label="Servicio">
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">Elegí un servicio</option>
              {props.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.durationMin} min · {formatPriceArs(s.priceCents)}
                </option>
              ))}
            </select>
          </Field>

          {service && multiStaff && (
            <Field label="Profesional">
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">Cualquiera disponible</option>
                {service.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {service && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Fecha">
                <input
                  type="date"
                  required
                  value={date}
                  min={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Horario">
                <select
                  required
                  value={slotKey}
                  onChange={(e) => setSlotKey(e.target.value)}
                  disabled={loadingSlots || totalSlots === 0}
                  className={`${INPUT_CLS} disabled:opacity-60`}
                >
                  <option value="">
                    {loadingSlots
                      ? "Buscando horarios..."
                      : totalSlots === 0
                        ? "Sin disponibilidad"
                        : "Elegí un horario"}
                  </option>
                  {singleStaffMode
                    ? availability.flatMap((a) =>
                        a.slots.map((slot) => (
                          <option
                            key={`${a.staffId}${SLOT_SEP}${slot.startsAt}`}
                            value={`${a.staffId}${SLOT_SEP}${slot.startsAt}`}
                          >
                            {fmtTime(slot.startsAt)}
                          </option>
                        ))
                      )
                    : availability.map((a) => (
                        <optgroup key={a.staffId} label={a.staffName}>
                          {a.slots.map((slot) => (
                            <option
                              key={`${a.staffId}${SLOT_SEP}${slot.startsAt}`}
                              value={`${a.staffId}${SLOT_SEP}${slot.startsAt}`}
                            >
                              {fmtTime(slot.startsAt)}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                </select>
              </Field>
            </div>
          )}
        </div>
      </Section>

      {service && selectedSlot && (
        <Section step={2} title="Tus datos">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Nombre y apellido"
                value={customer.customerName}
                onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })}
                className={INPUT_CLS}
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={customer.customerEmail}
                onChange={(e) => setCustomer({ ...customer, customerEmail: e.target.value })}
                className={INPUT_CLS}
              />
            </div>
            <input
              placeholder="Teléfono (opcional)"
              value={customer.customerPhone}
              onChange={(e) => setCustomer({ ...customer, customerPhone: e.target.value })}
              className={INPUT_CLS}
            />
            <textarea
              placeholder="Notas (opcional)"
              value={customer.notes}
              onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              rows={2}
              className={INPUT_CLS}
            />

            <div className="rounded-md bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
              <p className="text-zinc-500">Resumen</p>
              <p className="font-medium">
                {service.name} · {new Date(selectedSlot.startsAt).toLocaleString("es-AR")}
              </p>
              <p>
                Total: <strong>{formatPriceArs(service.priceCents)}</strong> · Seña a pagar
                ahora: <strong>{formatPriceArs(depositPreview)}</strong>
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md py-2 text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--brand)" }}
            >
              {submitting ? "Procesando..." : "Pagar seña y confirmar turno"}
            </button>
          </div>
        </Section>
      )}
    </form>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
    </label>
  );
}
