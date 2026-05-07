"use client";

import { useEffect, useMemo, useState } from "react";

export type ServiceOption = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  category: string | null;
  staffIds: string[];
};

export type StaffOption = {
  id: string;
  name: string;
};

export type PriorServiceOption = {
  id: string;
  name: string;
  removalMin: number;
};

export type DesignOption = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  isNails: boolean;
  services: ServiceOption[];
  staff: StaffOption[];
  priorServices: PriorServiceOption[];
  designs: DesignOption[];
  defaultDate: string;
  defaultTime: string;
};

type RetiroFlag = "none" | "with";
type DesignFlag = "none" | "with";
type SecondaryFlag = "none" | "with";

const CATEGORY_LABEL: Record<string, string> = {
  hands: "manos",
  feet: "pies",
};

function priceLabel(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

const SELECT_CLS =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-800";

export function AppointmentForm({
  action,
  isNails,
  services,
  staff,
  priorServices,
  designs,
  defaultDate,
  defaultTime,
}: Props) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  // Nails-only state
  const [secondaryChoice, setSecondaryChoice] = useState<SecondaryFlag>("none");
  const [secondaryServiceId, setSecondaryServiceId] = useState("");
  const [designChoice, setDesignChoice] = useState<DesignFlag>("none");
  const [designId, setDesignId] = useState("");
  const [retiroChoice, setRetiroChoice] = useState<RetiroFlag>("none");
  const [priorServiceId, setPriorServiceId] = useState("");

  const oppositeCategory = useMemo<"hands" | "feet" | null>(() => {
    if (!isNails || !selectedService?.category) return null;
    if (selectedService.category === "hands") return "feet";
    if (selectedService.category === "feet") return "hands";
    return null;
  }, [isNails, selectedService]);

  const secondaryOptions = useMemo<ServiceOption[]>(() => {
    if (!oppositeCategory) return [];
    return services.filter(
      (s) => s.category === oppositeCategory && s.id !== selectedService?.id
    );
  }, [services, oppositeCategory, selectedService?.id]);

  const secondaryService = useMemo(
    () => services.find((s) => s.id === secondaryServiceId) ?? null,
    [services, secondaryServiceId]
  );
  const design = useMemo(
    () => designs.find((d) => d.id === designId) ?? null,
    [designs, designId]
  );
  const priorService = useMemo(
    () => priorServices.find((p) => p.id === priorServiceId) ?? null,
    [priorServices, priorServiceId]
  );

  const eligibleStaff = useMemo(() => {
    if (!selectedService) return [];
    const allowed = new Set(selectedService.staffIds);
    let filtered = staff.filter((s) => allowed.has(s.id));
    // Si hay secundario, el staff debe atender ambos
    if (secondaryChoice === "with" && secondaryService) {
      const secAllowed = new Set(secondaryService.staffIds);
      filtered = filtered.filter((s) => secAllowed.has(s.id));
    }
    return filtered;
  }, [staff, selectedService, secondaryChoice, secondaryService]);

  const [staffId, setStaffId] = useState(eligibleStaff[0]?.id ?? "");
  const validStaffId = eligibleStaff.some((s) => s.id === staffId)
    ? staffId
    : eligibleStaff[0]?.id ?? "";

  // Si la lista elegible cambia y el actual ya no es válido, ajustamos.
  useEffect(() => {
    if (!eligibleStaff.some((s) => s.id === staffId)) {
      setStaffId(eligibleStaff[0]?.id ?? "");
    }
  }, [eligibleStaff, staffId]);

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);

  const startsAtIso = useMemo(() => {
    if (!date || !time) return "";
    const d = new Date(`${date}T${time}`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [date, time]);

  const extraMinutes = useMemo(() => {
    if (!isNails) return 0;
    let extra = 0;
    if (retiroChoice === "with" && priorService) extra += priorService.removalMin;
    if (designChoice === "with" && design) extra += design.durationMin;
    if (secondaryChoice === "with" && secondaryService) extra += secondaryService.durationMin;
    return extra;
  }, [
    isNails,
    retiroChoice,
    priorService,
    designChoice,
    design,
    secondaryChoice,
    secondaryService,
  ]);

  const totalPriceCents = useMemo(() => {
    if (!selectedService) return 0;
    return (
      selectedService.priceCents +
      (designChoice === "with" && design ? design.priceCents : 0) +
      (secondaryChoice === "with" && secondaryService ? secondaryService.priceCents : 0)
    );
  }, [selectedService, designChoice, design, secondaryChoice, secondaryService]);

  const totalDurationMin = (selectedService?.durationMin ?? 0) + extraMinutes;

  // Validación de pasos nails
  const nailsExtrasOk = isNails
    ? (secondaryChoice === "none" ||
        (secondaryChoice === "with" && !!secondaryService)) &&
      (designChoice === "none" || (designChoice === "with" && !!design)) &&
      (retiroChoice === "none" || (retiroChoice === "with" && !!priorService))
    : true;

  const canSubmit =
    !!serviceId && !!validStaffId && !!startsAtIso && nailsExtrasOk;

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

  function handleServiceChange(nextId: string) {
    setServiceId(nextId);
    setSecondaryChoice("none");
    setSecondaryServiceId("");
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="startsAt" value={startsAtIso} />
      <input type="hidden" name="staffId" value={validStaffId} />
      {isNails && (
        <>
          <input
            type="hidden"
            name="secondaryServiceId"
            value={secondaryChoice === "with" && secondaryService ? secondaryService.id : ""}
          />
          <input
            type="hidden"
            name="designId"
            value={designChoice === "with" && design ? design.id : ""}
          />
          <input
            type="hidden"
            name="procedureMode"
            value={retiroChoice === "with" && priorService ? "retiro" : "fresh"}
          />
          <input
            type="hidden"
            name="priorServiceId"
            value={retiroChoice === "with" && priorService ? priorService.id : ""}
          />
        </>
      )}

      <Section title="Servicio">
        <Field label="Servicio principal">
          <select
            name="serviceId"
            value={serviceId}
            onChange={(e) => handleServiceChange(e.target.value)}
            className={SELECT_CLS}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMin}min · {priceLabel(s.priceCents)}
              </option>
            ))}
          </select>
        </Field>

        {isNails && oppositeCategory && secondaryOptions.length > 0 && (
          <Field
            label={`Sumar ${CATEGORY_LABEL[oppositeCategory]}`}
            hint="Cliente que se hace manos y pies en el mismo turno."
          >
            <div className="space-y-2">
              <ToggleRow
                value={secondaryChoice}
                onChange={(v) => {
                  setSecondaryChoice(v);
                  if (v === "none") setSecondaryServiceId("");
                }}
                noLabel={`Solo ${CATEGORY_LABEL[selectedService?.category as "hands" | "feet"] ?? ""}`}
                yesLabel={`Sumar ${CATEGORY_LABEL[oppositeCategory]}`}
              />
              {secondaryChoice === "with" && (
                <select
                  value={secondaryServiceId}
                  onChange={(e) => setSecondaryServiceId(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="">Elegí el servicio…</option>
                  {secondaryOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · +{s.durationMin}min · +{priceLabel(s.priceCents)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </Field>
        )}

        {isNails && (
          <Field label="Diseño">
            <div className="space-y-2">
              <ToggleRow
                value={designChoice}
                onChange={(v) => {
                  setDesignChoice(v);
                  if (v === "none") setDesignId("");
                }}
                noLabel="Sin diseño"
                yesLabel="Con diseño"
              />
              {designChoice === "with" && (
                designs.length === 0 ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                    Todavía no cargaste diseños.
                  </p>
                ) : (
                  <select
                    value={designId}
                    onChange={(e) => setDesignId(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="">Elegí el diseño…</option>
                    {designs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · +{d.durationMin}min · +{priceLabel(d.priceCents)}
                      </option>
                    ))}
                  </select>
                )
              )}
            </div>
          </Field>
        )}

        {isNails && (
          <Field label="Retiro" hint="Sumá el tiempo de retiro de un servicio previo.">
            <div className="space-y-2">
              <ToggleRow
                value={retiroChoice}
                onChange={(v) => {
                  setRetiroChoice(v);
                  if (v === "none") setPriorServiceId("");
                }}
                noLabel="Sin retiro"
                yesLabel="Con retiro"
              />
              {retiroChoice === "with" && (
                priorServices.length === 0 ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                    Todavía no cargaste servicios previos.
                  </p>
                ) : (
                  <select
                    value={priorServiceId}
                    onChange={(e) => setPriorServiceId(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="">¿Qué se retira?…</option>
                    {priorServices.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · +{p.removalMin}min
                      </option>
                    ))}
                  </select>
                )
              )}
            </div>
          </Field>
        )}

        <Field label="Profesional">
          {eligibleStaff.length === 0 ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
              Ningún profesional cubre esta combinación. Asigná los servicios desde la ficha del profesional.
            </p>
          ) : (
            <select
              value={validStaffId}
              onChange={(e) => setStaffId(e.target.value)}
              className={SELECT_CLS}
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
              className={SELECT_CLS}
            />
          </Field>
          <Field label="Hora">
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={SELECT_CLS}
            />
          </Field>
        </div>
        {selectedService && (
          <p className="text-xs text-zinc-500">
            Duración total: {totalDurationMin} min{" "}
            {extraMinutes > 0 && (
              <span className="text-zinc-400">
                ({selectedService.durationMin} base + {extraMinutes} extras)
              </span>
            )}
            {" · "}Total: {priceLabel(totalPriceCents)}
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
              className={SELECT_CLS}
            />
          </Field>
          <Field label="Email">
            <input
              name="customerEmail"
              type="email"
              required
              placeholder="cliente@email.com"
              className={SELECT_CLS}
            />
          </Field>
          <Field label="Teléfono (opcional)">
            <input
              name="customerPhone"
              maxLength={40}
              placeholder="+54 11 ..."
              className={SELECT_CLS}
            />
          </Field>
          <Field label="Notas (opcional)">
            <input
              name="notes"
              maxLength={500}
              placeholder="Pidió producto X"
              className={SELECT_CLS}
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

function ToggleRow<T extends "none" | "with">({
  value,
  onChange,
  noLabel,
  yesLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  noLabel: string;
  yesLabel: string;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => onChange("none" as T)}
        className={`px-3 py-1.5 text-sm transition ${
          value === "none"
            ? "bg-sky-500 text-white"
            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
        }`}
      >
        {noLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("with" as T)}
        className={`border-l border-zinc-200 px-3 py-1.5 text-sm transition dark:border-zinc-700 ${
          value === "with"
            ? "bg-sky-500 text-white"
            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
        }`}
      >
        {yesLabel}
      </button>
    </div>
  );
}
