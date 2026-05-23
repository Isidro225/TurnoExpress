"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BusinessTypeIcon } from "@/app/_components/BusinessTypeIcon";

type StaffOption = { id: string; name: string };

type ServiceForFlow = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
  depositPct: number;
  category: string | null;
  staff: StaffOption[];
};

type PriorServiceOption = {
  id: string;
  name: string;
  removalMin: number;
};

type DesignOption = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
};

type Slot = { startsAt: string; endsAt: string };
type StaffAvailability = { staffId: string; staffName: string; slots: Slot[] };

type PriorAge = "D15_21" | "D21_25" | "MONTH_PLUS";
type ProcedureMode = "fresh" | "service" | "retiro";
type HasPrior = "yes" | "no" | "";
type DesignChoice = "none" | "with" | "";
type SecondaryChoice = "none" | "with" | "";

const CATEGORY_LABEL: Record<string, string> = {
  hands: "manos",
  feet: "pies",
};

type Props = {
  tenantSlug: string;
  businessType: string | null;
  mpEnabled: boolean;
  paymentBypassEnabled: boolean;
  services: ServiceForFlow[];
  priorServices: PriorServiceOption[];
  designs: DesignOption[];
  depositMinCents: number;
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
  const isNails = props.businessType === "nails";

  const initial = props.services.find((s) => s.id === props.initialServiceId) ?? null;
  const [serviceId, setServiceId] = useState<string>(initial?.id ?? "");

  // Estado específico nails. En otros tipos de negocio queda inerte.
  const [hasPrior, setHasPrior] = useState<HasPrior>("");
  const [priorServiceId, setPriorServiceId] = useState<string>("");
  const [priorAge, setPriorAge] = useState<PriorAge | "">("");
  const [retiroOrService, setRetiroOrService] = useState<"service" | "retiro" | "">("");
  const [designChoice, setDesignChoice] = useState<DesignChoice>("");
  const [designId, setDesignId] = useState<string>("");
  const [secondaryChoice, setSecondaryChoice] = useState<SecondaryChoice>("");
  const [secondaryServiceId, setSecondaryServiceId] = useState<string>("");

  const service = useMemo(
    () => props.services.find((s) => s.id === serviceId) ?? null,
    [props.services, serviceId]
  );
  const oppositeCategory = useMemo<"hands" | "feet" | null>(() => {
    if (!isNails || !service?.category) return null;
    if (service.category === "hands") return "feet";
    if (service.category === "feet") return "hands";
    return null;
  }, [isNails, service]);
  const secondaryOptions = useMemo<ServiceForFlow[]>(() => {
    if (!oppositeCategory) return [];
    return props.services.filter((s) => s.category === oppositeCategory && s.id !== service?.id);
  }, [props.services, oppositeCategory, service?.id]);
  const secondaryService = useMemo(
    () => props.services.find((s) => s.id === secondaryServiceId) ?? null,
    [props.services, secondaryServiceId]
  );
  const priorService = useMemo(
    () => props.priorServices.find((p) => p.id === priorServiceId) ?? null,
    [props.priorServices, priorServiceId]
  );
  const design = useMemo(
    () => props.designs.find((d) => d.id === designId) ?? null,
    [props.designs, designId]
  );
  const combinedStaff = useMemo<StaffOption[]>(() => {
    if (!service) return [];
    if (!secondaryService) return service.staff;
    const allowed = new Set(secondaryService.staff.map((s) => s.id));
    return service.staff.filter((s) => allowed.has(s.id));
  }, [service, secondaryService]);
  const multiStaff = combinedStaff.length > 1;

  // Modo de procedimiento (fresh / service / retiro) calculado desde las respuestas de uñas.
  const procedureMode: ProcedureMode | "" = useMemo(() => {
    if (!isNails) return "fresh";
    if (hasPrior === "no") return "fresh";
    if (hasPrior !== "yes" || !priorAge) return "";
    if (priorAge === "D15_21") return "service";
    if (priorAge === "MONTH_PLUS") return "retiro";
    return retiroOrService || "";
  }, [isNails, hasPrior, priorAge, retiroOrService]);

  const extraMinutes = useMemo(() => {
    if (!isNails || !service) return 0;
    let extra = 0;
    if (procedureMode === "retiro" && priorService) extra += priorService.removalMin;
    if (designChoice === "with" && design) extra += design.durationMin;
    if (secondaryChoice === "with" && secondaryService) extra += secondaryService.durationMin;
    return extra;
  }, [isNails, service, procedureMode, priorService, designChoice, design, secondaryChoice, secondaryService]);

  const totalPriceCents = useMemo(() => {
    if (!service) return 0;
    return (
      service.priceCents +
      (designChoice === "with" && design ? design.priceCents : 0) +
      (secondaryChoice === "with" && secondaryService ? secondaryService.priceCents : 0)
    );
  }, [service, designChoice, design, secondaryChoice, secondaryService]);

  const secondaryAnswered = !isNails
    ? true
    : !service || !oppositeCategory || secondaryOptions.length === 0
      ? true
      : secondaryChoice === "none" ||
        (secondaryChoice === "with" && !!secondaryService);

  const nailsIntroComplete = !isNails
    ? true
    : hasPrior === "no"
      ? true
      : hasPrior === "yes" &&
        !!priorService &&
        !!priorAge &&
        (priorAge !== "D21_25" || !!retiroOrService);

  const designAnswered = !isNails
    ? true
    : designChoice === "none" || (designChoice === "with" && !!design);

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
    if (!nailsIntroComplete || !designAnswered || !secondaryAnswered) return;

    let cancelled = false;
    async function load() {
      setLoadingSlots(true);
      const params = new URLSearchParams({
        tenant: props.tenantSlug,
        service: service!.id,
        date,
      });
      if (staffFilter) params.set("staff", staffFilter);
      if (extraMinutes > 0) params.set("extra", String(extraMinutes));
      if (secondaryChoice === "with" && secondaryService) {
        params.set("secondary", secondaryService.id);
      }

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
  }, [props.tenantSlug, service, date, staffFilter, extraMinutes, nailsIntroComplete, designAnswered, secondaryAnswered, secondaryChoice, secondaryService]);

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
    ? Math.max(
        100,
        props.depositMinCents,
        Math.round((totalPriceCents * service.depositPct) / 100)
      )
    : 0;
  const selectedStaffName = selectedSlot
    ? availability.find((a) => a.staffId === selectedSlot.staffId)?.staffName ??
      service?.staff.find((s) => s.id === selectedSlot.staffId)?.name ??
      "Profesional"
    : null;

  // activeStep: para uñas el primer paso es el "estado actual"; para otros tipos el primero es el servicio.
  const activeStep = useMemo(() => {
    if (isNails && !nailsIntroComplete) return 1;
    if (!service) return isNails ? 2 : 1;
    if (isNails && (!secondaryAnswered || !designAnswered)) return 3;
    if (!selectedSlot) return isNails ? 4 : 2;
    return isNails ? 5 : 3;
  }, [isNails, nailsIntroComplete, service, secondaryAnswered, designAnswered, selectedSlot]);

  const canSubmit =
    !!service &&
    !!selectedSlot &&
    !submitting &&
    nailsIntroComplete &&
    designAnswered &&
    secondaryAnswered;

  function handleServiceChange(nextServiceId: string) {
    setServiceId(nextServiceId);
    setStaffFilter("");
    setSlotKey("");
    setAvailability([]);
    setDesignChoice("");
    setDesignId("");
    setSecondaryChoice("");
    setSecondaryServiceId("");
    setError(null);
  }

  function handleHasPriorChange(value: HasPrior) {
    setHasPrior(value);
    if (value === "no") {
      setPriorServiceId("");
      setPriorAge("");
      setRetiroOrService("");
    }
    setSlotKey("");
    setAvailability([]);
    setError(null);
  }

  function handlePriorAgeChange(value: PriorAge) {
    setPriorAge(value);
    if (value !== "D21_25") setRetiroOrService("");
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
        ...(isNails
          ? {
              priorServiceId: hasPrior === "yes" ? priorServiceId : null,
              priorAge: hasPrior === "yes" ? priorAge : null,
              procedureMode,
              designId: designChoice === "with" ? designId : null,
              secondaryServiceId:
                secondaryChoice === "with" && secondaryService ? secondaryService.id : null,
            }
          : {}),
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
      <BookingHeader activeStep={activeStep} isNails={isNails} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-9">
          {isNails && (
            <StepSection
              step={1}
              title="Estado actual"
              subtitle="¿Venís con algo hecho? Nos ayuda a calcular el tiempo."
              active={activeStep === 1}
              complete={nailsIntroComplete}
            >
              <NailsIntakeBlock
                priorServices={props.priorServices}
                hasPrior={hasPrior}
                priorServiceId={priorServiceId}
                priorAge={priorAge}
                retiroOrService={retiroOrService}
                onHasPriorChange={handleHasPriorChange}
                onPriorServiceChange={(id) => {
                  setPriorServiceId(id);
                  setSlotKey("");
                  setAvailability([]);
                }}
                onPriorAgeChange={handlePriorAgeChange}
                onRetiroOrServiceChange={(value) => {
                  setRetiroOrService(value);
                  setSlotKey("");
                  setAvailability([]);
                }}
              />
            </StepSection>
          )}

          <StepSection
            step={isNails ? 2 : 1}
            title="Servicio"
            subtitle={isNails ? "¿Qué te querés hacer?" : "Elegí qué querés reservar"}
            muted={isNails && !nailsIntroComplete}
            active={activeStep === (isNails ? 2 : 1)}
            complete={!!service && (isNails ? secondaryAnswered && designAnswered : true)}
          >
            {(!isNails || nailsIntroComplete) ? (
              <div className="space-y-5">
                <ServiceCards
                  services={props.services}
                  businessType={props.businessType}
                  selectedServiceId={serviceId}
                  onSelect={handleServiceChange}
                />
                {isNails && service && oppositeCategory && secondaryOptions.length > 0 && (
                  <SecondaryPicker
                    primaryCategory={service.category as "hands" | "feet"}
                    oppositeCategory={oppositeCategory}
                    options={secondaryOptions}
                    choice={secondaryChoice}
                    selectedSecondaryId={secondaryServiceId}
                    onChoiceChange={(value) => {
                      setSecondaryChoice(value);
                      if (value === "none") setSecondaryServiceId("");
                      setStaffFilter("");
                      setSlotKey("");
                      setAvailability([]);
                    }}
                    onSecondaryChange={(id) => {
                      setSecondaryServiceId(id);
                      setStaffFilter("");
                      setSlotKey("");
                      setAvailability([]);
                    }}
                  />
                )}
                {isNails && service && (
                  <DesignPicker
                    designs={props.designs}
                    choice={designChoice}
                    selectedDesignId={designId}
                    onChoiceChange={(value) => {
                      setDesignChoice(value);
                      if (value === "none") setDesignId("");
                      setSlotKey("");
                      setAvailability([]);
                    }}
                    onDesignChange={(id) => {
                      setDesignId(id);
                      setSlotKey("");
                      setAvailability([]);
                    }}
                  />
                )}
              </div>
            ) : (
              <EmptyStep title="Primero contanos cómo venís">
                Respondé las preguntas de arriba para elegir el servicio.
              </EmptyStep>
            )}
          </StepSection>

          <StepSection
            step={isNails ? 3 : 2}
            title="Fecha y horario"
            subtitle="Encontrá un momento disponible"
            muted={!service || (isNails && (!designAnswered || !secondaryAnswered))}
            active={activeStep === (isNails ? 3 : 2)}
            complete={!!selectedSlot}
          >
            {service && (!isNails || (designAnswered && secondaryAnswered)) ? (
              <div className="space-y-5">
                {combinedStaff.length === 0 ? (
                  <EmptyStep title="No hay profesionales para esta combinación">
                    Probá con otro servicio o quitá el extra para ver disponibilidad.
                  </EmptyStep>
                ) : null}
                {multiStaff && (
                  <StaffPicker
                    staff={combinedStaff}
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
              <EmptyStep title={isNails ? "Falta elegir el servicio" : "Elegí un servicio"}>
                {isNails
                  ? "Elegí el servicio y si va con o sin diseño para ver horarios."
                  : "Primero seleccioná qué querés reservar para ver la agenda disponible."}
              </EmptyStep>
            )}
          </StepSection>

          <StepSection
            step={isNails ? 4 : 3}
            title="Tus datos"
            subtitle="Datos para confirmar el turno"
            muted={!selectedSlot}
            active={activeStep === (isNails ? 4 : 3)}
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
                  required
                  placeholder="Teléfono"
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
              <EmptyStep title="Falta el horario">
                Elegí fecha y horario para completar tus datos.
              </EmptyStep>
            )}
          </StepSection>
        </div>

        <SummaryPanel
          service={service}
          design={designChoice === "with" ? design : null}
          secondaryService={secondaryChoice === "with" ? secondaryService : null}
          totalPriceCents={totalPriceCents}
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

function BookingHeader({ activeStep, isNails }: { activeStep: number; isNails: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [stuck, setStuck] = useState(false);

  // Detecta cuándo la card queda pegada al top para colapsar el título y dejar
  // sólo los pills. Sólo aplica en mobile/tablet (en lg+ la card es estática).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onScroll = () => setStuck(el.getBoundingClientRect().top <= 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="sticky top-0 z-30 overflow-hidden rounded-lg border border-[color:var(--brand-border)] bg-white/95 shadow-sm backdrop-blur lg:static lg:z-auto"
      style={{ boxShadow: "0 18px 60px var(--brand-shadow)" }}
    >
      <div className={`px-5 transition-[padding] sm:px-6 lg:py-5 ${stuck ? "py-2.5" : "py-5"}`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className={stuck ? "hidden lg:block" : ""}>
            <p className="text-xs font-semibold uppercase text-[color:var(--brand-strong)]">
              Reservá tu turno
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-950">Armá tu reserva</h2>
          </div>
          <StepProgress activeStep={activeStep} isNails={isNails} />
        </div>
      </div>
    </section>
  );
}

function ServiceCards({
  services,
  businessType,
  selectedServiceId,
  onSelect,
}: {
  services: ServiceForFlow[];
  businessType: string | null;
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
              <div className="flex min-w-0 gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                    selected
                      ? "bg-white text-[color:var(--brand-strong)]"
                      : "bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]"
                  }`}
                >
                  <BusinessTypeIcon businessType={businessType} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-zinc-950">{service.name}</h3>
                  {selected && service.description && (
                    <p className="mt-1 text-sm leading-5 text-zinc-500">{service.description}</p>
                  )}
                </div>
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
        <EmptyStep title="No hay horarios para ese día">
          Probá con otra fecha o cambiá el profesional seleccionado.
        </EmptyStep>
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
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="h-3 w-36 animate-pulse rounded-full bg-zinc-100" />
        <div className="h-3 w-16 animate-pulse rounded-full bg-zinc-100" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-11 animate-pulse rounded-lg bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}

function SummaryPanel({
  service,
  design,
  secondaryService,
  totalPriceCents,
  selectedSlotStartsAt,
  selectedStaffName,
  depositPreview,
  paymentBypassEnabled,
  submitting,
  canSubmit,
  error,
}: {
  service: ServiceForFlow | null;
  design: DesignOption | null;
  secondaryService: ServiceForFlow | null;
  totalPriceCents: number;
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
          {secondaryService && (
            <SummaryRow
              label="Sumando"
              value={`${secondaryService.name} (+${formatPriceArs(secondaryService.priceCents)})`}
            />
          )}
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
          {design && (
            <SummaryRow label="Diseño" value={`${design.name} (+${formatPriceArs(design.priceCents)})`} />
          )}
          <SummaryRow
            label="Total"
            value={service ? formatPriceArs(totalPriceCents) : "Pendiente"}
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

function StepProgress({ activeStep, isNails }: { activeStep: number; isNails: boolean }) {
  const steps = isNails
    ? ["Estado", "Servicio", "Horario", "Datos"]
    : ["Servicio", "Horario", "Datos"];

  return (
    <div className={`grid gap-2 text-xs sm:min-w-80 ${isNails ? "grid-cols-4" : "grid-cols-3"}`}>
      {steps.map((label, index) => {
        const step = index + 1;
        const active = step === activeStep;
        const done = step < activeStep;

        return (
          <div
            key={label}
            className={`flex flex-col items-center gap-1 rounded-2xl border px-1.5 py-2 text-center transition sm:flex-row sm:gap-2 sm:rounded-full sm:px-3 sm:text-left ${
              active || done
                ? "border-[color:var(--brand-border)] bg-[color:var(--brand-soft)] text-zinc-950"
                : "border-zinc-200 bg-white text-zinc-500"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                active || done
                  ? "bg-[color:var(--brand)] text-[color:var(--brand-foreground)]"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {done ? "✓" : step}
            </span>
            <span className="font-medium leading-tight sm:truncate">{label}</span>
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
  complete = false,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  muted?: boolean;
  active?: boolean;
  complete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`space-y-4 border-l-4 pl-4 transition ${
        active || complete ? "border-[color:var(--brand)]" : "border-zinc-200"
      } ${muted ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
            active || complete ? "shadow-[0_12px_28px_var(--brand-shadow)]" : ""
          }`}
          style={{
            backgroundColor: muted ? "#f4f4f5" : complete ? "var(--brand-soft)" : "var(--brand)",
            color: muted ? "#a1a1aa" : complete ? "var(--brand-strong)" : "var(--brand-foreground)",
          }}
        >
          {complete ? "✓" : step}
        </span>
        <div>
          <h3 className={`text-base font-semibold ${muted ? "text-zinc-400" : "text-zinc-950"}`}>
            {title}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        </div>
        {complete && (
          <span className="rounded-full bg-[color:var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--brand-strong)]">
            Listo
          </span>
        )}
      </div>
      <div className={active ? "animate-step-reveal" : ""}>{children}</div>
    </section>
  );
}

function EmptyStep({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[color:var(--brand-border)] bg-[color:var(--brand-soft)] p-4 text-sm">
      {title && <p className="font-semibold text-zinc-900">{title}</p>}
      <p className={title ? "mt-1 text-zinc-600" : "text-zinc-600"}>{children}</p>
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

function NailsIntakeBlock({
  priorServices,
  hasPrior,
  priorServiceId,
  priorAge,
  retiroOrService,
  onHasPriorChange,
  onPriorServiceChange,
  onPriorAgeChange,
  onRetiroOrServiceChange,
}: {
  priorServices: PriorServiceOption[];
  hasPrior: HasPrior;
  priorServiceId: string;
  priorAge: PriorAge | "";
  retiroOrService: "service" | "retiro" | "";
  onHasPriorChange: (value: HasPrior) => void;
  onPriorServiceChange: (id: string) => void;
  onPriorAgeChange: (value: PriorAge) => void;
  onRetiroOrServiceChange: (value: "service" | "retiro") => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-700">¿Ya tenés algo hecho?</p>
        <div className="grid grid-cols-2 gap-2 sm:max-w-md">
          <ChoiceButton selected={hasPrior === "no"} onClick={() => onHasPriorChange("no")}>
            No, vengo sin nada
          </ChoiceButton>
          <ChoiceButton selected={hasPrior === "yes"} onClick={() => onHasPriorChange("yes")}>
            Sí, tengo algo
          </ChoiceButton>
        </div>
      </div>

      {hasPrior === "yes" && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">¿Qué tenés hecho?</p>
          {priorServices.length === 0 ? (
            <EmptyStep title="Sin opciones cargadas">
              El negocio todavía no configuró servicios previos. Avisanos por WhatsApp.
            </EmptyStep>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {priorServices.map((p) => (
                <ChoiceButton
                  key={p.id}
                  selected={priorServiceId === p.id}
                  onClick={() => onPriorServiceChange(p.id)}
                >
                  <span className="block font-medium">{p.name}</span>
                  <span className="block text-xs text-zinc-500">retiro {p.removalMin} min</span>
                </ChoiceButton>
              ))}
            </div>
          )}
        </div>
      )}

      {hasPrior === "yes" && priorServiceId && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">¿Hace cuánto te lo hiciste?</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <ChoiceButton selected={priorAge === "D15_21"} onClick={() => onPriorAgeChange("D15_21")}>
              <span className="block font-medium">15 a 21 días</span>
              <span className="block text-xs text-zinc-500">va service</span>
            </ChoiceButton>
            <ChoiceButton selected={priorAge === "D21_25"} onClick={() => onPriorAgeChange("D21_25")}>
              <span className="block font-medium">21 a 25 días</span>
              <span className="block text-xs text-zinc-500">depende del estado</span>
            </ChoiceButton>
            <ChoiceButton selected={priorAge === "MONTH_PLUS"} onClick={() => onPriorAgeChange("MONTH_PLUS")}>
              <span className="block font-medium">Más de un mes</span>
              <span className="block text-xs text-zinc-500">va retiro</span>
            </ChoiceButton>
          </div>
        </div>
      )}

      {hasPrior === "yes" && priorAge === "D21_25" && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">¿Cómo lo querés hacer?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ChoiceButton
              selected={retiroOrService === "service"}
              onClick={() => onRetiroOrServiceChange("service")}
            >
              <span className="block font-medium">Service</span>
              <span className="block text-xs text-zinc-500">si está en buen estado</span>
            </ChoiceButton>
            <ChoiceButton
              selected={retiroOrService === "retiro"}
              onClick={() => onRetiroOrServiceChange("retiro")}
            >
              <span className="block font-medium">Retiro</span>
              <span className="block text-xs text-zinc-500">retira y arma de cero</span>
            </ChoiceButton>
          </div>
        </div>
      )}
    </div>
  );
}

function DesignPicker({
  designs,
  choice,
  selectedDesignId,
  onChoiceChange,
  onDesignChange,
}: {
  designs: DesignOption[];
  choice: DesignChoice;
  selectedDesignId: string;
  onChoiceChange: (value: DesignChoice) => void;
  onDesignChange: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-700">¿Con o sin diseño?</p>
      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        <ChoiceButton selected={choice === "none"} onClick={() => onChoiceChange("none")}>
          Sin diseño
        </ChoiceButton>
        <ChoiceButton selected={choice === "with"} onClick={() => onChoiceChange("with")}>
          Con diseño
        </ChoiceButton>
      </div>

      {choice === "with" && (
        <div className="space-y-2">
          {designs.length === 0 ? (
            <EmptyStep title="Sin diseños cargados">
              El negocio todavía no cargó diseños. Avisanos por WhatsApp si querés uno.
            </EmptyStep>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {designs.map((d) => (
                <ChoiceButton
                  key={d.id}
                  selected={selectedDesignId === d.id}
                  onClick={() => onDesignChange(d.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="block font-medium">{d.name}</span>
                    <span className="block text-sm font-semibold text-zinc-950">
                      +${(d.priceCents / 100).toLocaleString("es-AR")}
                    </span>
                  </div>
                  <span className="block text-xs text-zinc-500">+{d.durationMin} min</span>
                </ChoiceButton>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SecondaryPicker({
  primaryCategory,
  oppositeCategory,
  options,
  choice,
  selectedSecondaryId,
  onChoiceChange,
  onSecondaryChange,
}: {
  primaryCategory: "hands" | "feet";
  oppositeCategory: "hands" | "feet";
  options: ServiceForFlow[];
  choice: SecondaryChoice;
  selectedSecondaryId: string;
  onChoiceChange: (value: SecondaryChoice) => void;
  onSecondaryChange: (id: string) => void;
}) {
  const oppositeLabel = CATEGORY_LABEL[oppositeCategory];
  const primaryLabel = CATEGORY_LABEL[primaryCategory];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-700">
        ¿Querés sumar también {oppositeLabel}?
      </p>
      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        <ChoiceButton selected={choice === "none"} onClick={() => onChoiceChange("none")}>
          Solo {primaryLabel}
        </ChoiceButton>
        <ChoiceButton selected={choice === "with"} onClick={() => onChoiceChange("with")}>
          Sumar {oppositeLabel}
        </ChoiceButton>
      </div>

      {choice === "with" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((s) => (
            <ChoiceButton
              key={s.id}
              selected={selectedSecondaryId === s.id}
              onClick={() => onSecondaryChange(s.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="block font-medium">{s.name}</span>
                <span className="block text-sm font-semibold text-zinc-950">
                  +{formatPriceArs(s.priceCents)}
                </span>
              </div>
              <span className="block text-xs text-zinc-500">+{s.durationMin} min</span>
            </ChoiceButton>
          ))}
        </div>
      )}
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2.5 text-left text-sm transition hover:border-[color:var(--brand)] ${
        selected
          ? "border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-zinc-950"
          : "border-zinc-200 bg-white text-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
