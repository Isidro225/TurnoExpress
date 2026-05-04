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
  paymentBypassEnabled: boolean;
  services: ServiceForFlow[];
  initialServiceId: string | null;
};

const SLOT_SEP = "::";

const INPUT_CLS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:border-zinc-300 focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-ring)] disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400";

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

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPriceArs(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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

  useEffect(() => {
    if (!service) return;

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

  const depositPreview = service
    ? Math.max(100, Math.round((service.priceCents * service.depositPct) / 100))
    : 0;
  const selectedStaffName = selectedSlot
    ? availability.find((a) => a.staffId === selectedSlot.staffId)?.staffName ??
      service?.staff.find((s) => s.id === selectedSlot.staffId)?.name ??
      "Profesional"
    : null;
  const activeStep = selectedSlot ? 3 : service ? 2 : 1;
  const canSubmit = !!service && !!selectedSlot && !submitting;

  function handleServiceChange(nextServiceId: string) {
    setServiceId(nextServiceId);
    setStaffFilter("");
    setSlotKey("");
    setAvailability([]);
    setError(null);
  }

  function handleStaffFilterChange(nextStaffId: string) {
    setStaffFilter(nextStaffId);
    setSlotKey("");
    setAvailability([]);
    setError(null);
  }

  function handleDateChange(nextDate: string) {
    setDate(nextDate);
    setSlotKey("");
    setAvailability([]);
    setError(null);
  }

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

    const nextUrl = data.redirectUrl ?? data.initPoint;
    if (!nextUrl) {
      setError("La reserva se creó, pero no pudimos abrir la confirmación.");
      setSubmitting(false);
      return;
    }
    window.location.href = nextUrl;
  }

  if (!props.paymentBypassEnabled && !props.mpEnabled) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800 shadow-sm">
        El negocio aún no conectó Mercado Pago. No se pueden recibir reservas todavía.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <BookingHeader activeStep={activeStep} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-9">
          <StepSection
            step={1}
            title="Servicio"
            subtitle="Elegí qué querés reservar"
            active={activeStep === 1}
          >
            <ServiceCards
              services={props.services}
              selectedServiceId={serviceId}
              onSelect={handleServiceChange}
            />
          </StepSection>

          <StepSection
            step={2}
            title="Fecha y horario"
            subtitle="Encontrá un momento disponible"
            muted={!service}
            active={activeStep === 2}
          >
            {service ? (
              <div className="space-y-5">
                {multiStaff && (
                  <StaffPicker
                    staff={service.staff}
                    selectedStaffId={staffFilter}
                    onSelect={handleStaffFilterChange}
                  />
                )}

                <Field label="Fecha">
                  <input
                    type="date"
                    required
                    value={date}
                    min={todayISO()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className={INPUT_CLS}
                  />
                </Field>

                <TimePicker
                  availability={availability}
                  loading={loadingSlots}
                  multiStaff={multiStaff}
                  selectedStaffId={staffFilter}
                  selectedSlotKey={slotKey}
                  onSelect={setSlotKey}
                />
              </div>
            ) : (
              <EmptyStep>Primero elegí un servicio para ver la agenda disponible.</EmptyStep>
            )}
          </StepSection>

          <StepSection
            step={3}
            title="Tus datos"
            subtitle="Datos para confirmar el turno"
            muted={!selectedSlot}
            active={activeStep === 3}
          >
            {service && selectedSlot ? (
              <div className="space-y-4">
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
                  rows={3}
                  className={INPUT_CLS}
                />
                {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              </div>
            ) : (
              <EmptyStep>Elegí fecha y horario para completar tus datos.</EmptyStep>
            )}
          </StepSection>
        </div>

        <SummaryPanel
          service={service}
          selectedSlotStartsAt={selectedSlot?.startsAt ?? null}
          selectedStaffName={selectedStaffName}
          depositPreview={depositPreview}
          paymentBypassEnabled={props.paymentBypassEnabled}
          submitting={submitting}
          canSubmit={canSubmit}
          error={error}
        />
      </div>
    </form>
  );
}

function BookingHeader({ activeStep }: { activeStep: number }) {
  return (
    <section
      className="overflow-hidden rounded-lg border border-[color:var(--brand-border)] bg-white shadow-sm"
      style={{ boxShadow: "0 18px 60px var(--brand-shadow)" }}
    >
      <div
        className="px-5 py-5 text-white sm:px-6"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--brand-deep), var(--brand-dark), var(--brand))",
        }}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[color:var(--brand-on-dark)]">
              Reserva online
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Elegí tu turno</h2>
          </div>
          <StepProgress activeStep={activeStep} />
        </div>
      </div>
    </section>
  );
}

function ServiceCards({
  services,
  selectedServiceId,
  onSelect,
}: {
  services: ServiceForFlow[];
  selectedServiceId: string;
  onSelect: (serviceId: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {services.map((service) => {
        const selected = service.id === selectedServiceId;
        const deposit = Math.max(100, Math.round((service.priceCents * service.depositPct) / 100));

        return (
          <button
            key={service.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(service.id)}
            className={`group rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--brand)] hover:shadow-lg hover:shadow-[color:var(--brand-shadow)] ${
              selected
                ? "border-[color:var(--brand)] bg-[color:var(--brand-soft)] shadow-lg shadow-[color:var(--brand-shadow)]"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">{service.name}</h3>
                {service.description && (
                  <p className="mt-1 text-sm leading-5 text-zinc-500">{service.description}</p>
                )}
              </div>
              <p className="shrink-0 text-sm font-semibold text-zinc-950">
                {formatPriceArs(service.priceCents)}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-zinc-600">
              <span className="rounded-full bg-zinc-100 px-2.5 py-1">{service.durationMin} min</span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1">
                Seña {formatPriceArs(deposit)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StaffPicker({
  staff,
  selectedStaffId,
  onSelect,
}: {
  staff: StaffOption[];
  selectedStaffId: string;
  onSelect: (staffId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-700">Profesional</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <StaffButton selected={!selectedStaffId} name="Cualquiera disponible" onClick={() => onSelect("")} />
        {staff.map((item) => (
          <StaffButton
            key={item.id}
            selected={selectedStaffId === item.id}
            name={item.name}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StaffButton({
  selected,
  name,
  onClick,
}: {
  selected: boolean;
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition hover:border-[color:var(--brand)] ${
        selected ? "border-[color:var(--brand)] bg-[color:var(--brand-soft)]" : "border-zinc-200 bg-white"
      }`}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{
          backgroundColor: selected ? "var(--brand)" : "var(--brand-soft)",
          color: selected ? "var(--brand-foreground)" : "var(--brand-strong)",
        }}
      >
        {initials(name) || "TD"}
      </span>
      <span className="min-w-0 truncate font-medium text-zinc-800">{name}</span>
    </button>
  );
}

function TimePicker({
  availability,
  loading,
  multiStaff,
  selectedStaffId,
  selectedSlotKey,
  onSelect,
}: {
  availability: StaffAvailability[];
  loading: boolean;
  multiStaff: boolean;
  selectedStaffId: string;
  selectedSlotKey: string;
  onSelect: (slotKey: string) => void;
}) {
  const totalSlots = availability.reduce((acc, item) => acc + item.slots.length, 0);
  const showGroups = multiStaff && !selectedStaffId;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-700">Horarios disponibles</p>
        {!loading && totalSlots > 0 && (
          <p className="text-xs text-zinc-500">
            {totalSlots} {totalSlots === 1 ? "horario" : "horarios"}
          </p>
        )}
      </div>

      {loading ? (
        <SlotSkeleton />
      ) : totalSlots === 0 ? (
        <EmptyStep>Sin horarios para esta fecha.</EmptyStep>
      ) : showGroups ? (
        <div className="space-y-4">
          {availability
            .filter((item) => item.slots.length > 0)
            .map((item) => (
              <div key={item.staffId} className="space-y-2">
                <p className="text-xs font-semibold uppercase text-zinc-500">{item.staffName}</p>
                <SlotGrid
                  staffId={item.staffId}
                  slots={item.slots}
                  selectedSlotKey={selectedSlotKey}
                  onSelect={onSelect}
                />
              </div>
            ))}
        </div>
      ) : (
        <SlotGrid
          staffId={availability[0]?.staffId ?? selectedStaffId}
          slots={availability.flatMap((item) => item.slots.map((slot) => ({ ...slot, staffId: item.staffId })))}
          selectedSlotKey={selectedSlotKey}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

function SlotGrid({
  staffId,
  slots,
  selectedSlotKey,
  onSelect,
}: {
  staffId: string;
  slots: Array<Slot & { staffId?: string }>;
  selectedSlotKey: string;
  onSelect: (slotKey: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const nextStaffId = slot.staffId ?? staffId;
        const key = `${nextStaffId}${SLOT_SEP}${slot.startsAt}`;
        const selected = selectedSlotKey === key;

        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(key)}
            className={`min-h-11 rounded-lg border px-2 text-sm font-semibold transition hover:border-[color:var(--brand)] ${
              selected
                ? "border-[color:var(--brand)] bg-[color:var(--brand)] text-[color:var(--brand-foreground)] shadow-md shadow-[color:var(--brand-shadow)]"
                : "border-zinc-200 bg-white text-zinc-800"
            }`}
          >
            {fmtTime(slot.startsAt)}
          </button>
        );
      })}
    </div>
  );
}

function SlotSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-11 animate-pulse rounded-lg bg-zinc-100" />
      ))}
    </div>
  );
}

function SummaryPanel({
  service,
  selectedSlotStartsAt,
  selectedStaffName,
  depositPreview,
  paymentBypassEnabled,
  submitting,
  canSubmit,
  error,
}: {
  service: ServiceForFlow | null;
  selectedSlotStartsAt: string | null;
  selectedStaffName: string | null;
  depositPreview: number;
  paymentBypassEnabled: boolean;
  submitting: boolean;
  canSubmit: boolean;
  error: string | null;
}) {
  return (
    <aside className="lg:sticky lg:top-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase text-zinc-500">Resumen</p>
        <div className="mt-4 divide-y divide-zinc-100 text-sm">
          <SummaryRow label="Servicio" value={service?.name ?? "Pendiente"} muted={!service} />
          <SummaryRow
            label="Profesional"
            value={selectedStaffName ?? (service ? "A definir" : "Pendiente")}
            muted={!selectedStaffName}
          />
          <SummaryRow
            label="Fecha"
            value={selectedSlotStartsAt ? fmtDateTime(selectedSlotStartsAt) : "Pendiente"}
            muted={!selectedSlotStartsAt}
          />
          <SummaryRow
            label="Total"
            value={service ? formatPriceArs(service.priceCents) : "Pendiente"}
            muted={!service}
          />
          <SummaryRow
            label={paymentBypassEnabled ? "Seña" : "Pagás ahora"}
            value={
              service
                ? paymentBypassEnabled
                  ? "Modo test"
                  : formatPriceArs(depositPreview)
                : "Pendiente"
            }
            muted={!service}
          />
        </div>

        <div className="mt-5 space-y-2 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
          <p>Confirmación inmediata</p>
          <p>{paymentBypassEnabled ? "Sin cobro en modo test" : "Pago seguro con Mercado Pago"}</p>
          <p>{paymentBypassEnabled ? "La confirmación queda registrada" : "Pagás solo la seña al reservar"}</p>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-[0_16px_36px_var(--brand-shadow)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_var(--brand-shadow)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-accent))",
            color: "var(--brand-foreground)",
          }}
        >
          {submitting
            ? "Procesando..."
            : paymentBypassEnabled
              ? "Confirmar turno sin pagar"
              : "Reservar y pagar seña"}
        </button>
      </div>
    </aside>
  );
}

function SummaryRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-zinc-500">{label}</span>
      <strong className={`text-right font-semibold ${muted ? "text-zinc-400" : "text-zinc-950"}`}>
        {value}
      </strong>
    </div>
  );
}

function StepProgress({ activeStep }: { activeStep: number }) {
  const steps = ["Servicio", "Horario", "Datos"];

  return (
    <div className="grid grid-cols-3 gap-2 text-xs sm:min-w-80">
      {steps.map((label, index) => {
        const step = index + 1;
        const active = step === activeStep;
        const done = step < activeStep;

        return (
          <div
            key={label}
            className={`rounded-full border px-3 py-2 ${
              active || done
                ? "border-white/25 bg-white/15 text-white"
                : "border-white/10 bg-white/5 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                  active || done ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-300"
                }`}
              >
                {step}
              </span>
              <span className="truncate font-medium">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepSection({
  step,
  title,
  subtitle,
  muted = false,
  active = false,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  muted?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`space-y-4 transition ${muted ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
            active ? "shadow-[0_12px_28px_var(--brand-shadow)]" : ""
          }`}
          style={{
            backgroundColor: muted ? "#f4f4f5" : "var(--brand)",
            color: muted ? "#a1a1aa" : "var(--brand-foreground)",
          }}
        >
          {step}
        </span>
        <div>
          <h3 className={`text-base font-semibold ${muted ? "text-zinc-400" : "text-zinc-950"}`}>
            {title}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
      </div>
      <div className={active ? "animate-step-reveal" : ""}>{children}</div>
    </section>
  );
}

function EmptyStep({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
