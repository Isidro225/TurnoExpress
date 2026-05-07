"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Step = {
  activeStep: 1 | 2 | 3;
  serviceIdx: number; // -1 = none
  slotIdx: number; // -1 = none
  formFilled: boolean;
  confirmed: boolean;
};

const SEQUENCE: { step: Step; hold: number }[] = [
  { step: { activeStep: 1, serviceIdx: -1, slotIdx: -1, formFilled: false, confirmed: false }, hold: 1400 },
  { step: { activeStep: 1, serviceIdx: 1, slotIdx: -1, formFilled: false, confirmed: false }, hold: 1100 },
  { step: { activeStep: 2, serviceIdx: 1, slotIdx: -1, formFilled: false, confirmed: false }, hold: 1100 },
  { step: { activeStep: 2, serviceIdx: 1, slotIdx: 2, formFilled: false, confirmed: false }, hold: 1100 },
  { step: { activeStep: 3, serviceIdx: 1, slotIdx: 2, formFilled: true, confirmed: false }, hold: 1500 },
  { step: { activeStep: 3, serviceIdx: 1, slotIdx: 2, formFilled: true, confirmed: true }, hold: 2400 },
];

const SERVICES = [
  { name: "Corte de pelo", duration: 30, price: "$8.000", deposit: "$2.400", totalCents: 8000 },
  { name: "Corte + barba", duration: 45, price: "$12.000", deposit: "$3.600", totalCents: 12000 },
];

const SLOTS = ["10:00", "10:45", "11:30", "14:00", "15:15", "16:00"];

const STEP_TITLES: Record<1 | 2 | 3, { title: string; subtitle: string }> = {
  1: { title: "Servicio", subtitle: "Elegí qué querés reservar" },
  2: { title: "Fecha y horario", subtitle: "Encontrá un momento disponible" },
  3: { title: "Tus datos", subtitle: "Datos para confirmar el turno" },
};

export function PhoneMockup() {
  const [stepIdx, setStepIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(
      () => setStepIdx((i) => (i + 1) % SEQUENCE.length),
      SEQUENCE[stepIdx].hold
    );
    return () => clearTimeout(t);
  }, [stepIdx, paused]);

  const { activeStep, serviceIdx, slotIdx, formFilled, confirmed } = SEQUENCE[stepIdx].step;

  const step1Done = serviceIdx >= 0 && (activeStep > 1 || confirmed);
  const step2Done = slotIdx >= 0 && (activeStep > 2 || confirmed);
  const step3Done = confirmed;

  const selectedService = serviceIdx >= 0 ? SERVICES[serviceIdx] : null;
  const selectedSlot = slotIdx >= 0 ? SLOTS[slotIdx] : null;
  const stepInfo = STEP_TITLES[activeStep];

  return (
    <div
      className="relative mx-auto w-full max-w-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] dark:border-zinc-800 dark:bg-zinc-950">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-100 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[11px] text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-emerald-500">
              <path d="M5 12V8a7 7 0 0 1 14 0v4" strokeLinecap="round" />
              <rect x="4" y="12" width="16" height="9" rx="2" />
            </svg>
            <span className="truncate font-mono">turnoexpress.com/juan</span>
          </div>
        </div>

        {/* Tenant strip */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
              <Image src="/Icono.png" alt="" width={331} height={277} className="h-6 w-auto" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Peluquería Juan</p>
              <p className="text-[11px] text-zinc-500">turnoexpress.com/juan</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            Abierto
          </span>
        </div>

        {/* Booking flow body */}
        <div className="space-y-3 bg-zinc-50 p-4 dark:bg-zinc-900/40">
          {/* BookingHeader */}
          <div className="rounded-lg border border-sky-100 bg-white p-3.5 shadow-sm dark:border-sky-900/40 dark:bg-zinc-950">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              Reservá tu turno
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Armá tu reserva
            </h3>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              <StepChip n={1} label="Servicio" active={activeStep === 1} done={step1Done} />
              <StepChip n={2} label="Horario" active={activeStep === 2} done={step2Done} />
              <StepChip n={3} label="Datos" active={activeStep === 3} done={step3Done} />
            </div>
          </div>

          {/* Active StepSection */}
          <div className="rounded-lg border border-zinc-200 border-l-4 border-l-sky-500 bg-white p-3 dark:border-zinc-800 dark:border-l-sky-500 dark:bg-zinc-950">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-white shadow-md shadow-sky-500/30">
                {activeStep}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  {stepInfo.title}
                </h4>
                <p className="text-[11px] text-zinc-500">{stepInfo.subtitle}</p>
              </div>
            </div>

            <div key={activeStep} className="mt-3 animate-step-reveal">
              {activeStep === 1 && (
                <div className="space-y-2">
                  {SERVICES.map((s, i) => {
                    const selected = i === serviceIdx;
                    return (
                      <div
                        key={s.name}
                        className={`rounded-lg border p-2.5 transition-all duration-300 ${
                          selected
                            ? "border-sky-500 bg-sky-50 shadow-sm shadow-sky-500/10 dark:bg-sky-950/40"
                            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-xs ${selected ? "font-semibold" : "font-medium"} text-zinc-900 dark:text-zinc-100`}>
                              {s.name}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                {s.duration} min
                              </span>
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                Seña {s.deposit}
                              </span>
                            </div>
                          </div>
                          <p className="shrink-0 text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                            {s.price}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-2.5">
                  <div>
                    <p className="mb-1 text-[10px] font-medium text-zinc-700 dark:text-zinc-300">Fecha</p>
                    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                      <CalendarMiniIcon />
                      <span>Mar, 13 de mayo</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">Horarios disponibles</p>
                      <p className="text-[10px] text-zinc-500">{SLOTS.length} horarios</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SLOTS.map((slot, i) => {
                        const selected = i === slotIdx;
                        return (
                          <div
                            key={slot}
                            className={`rounded-md border py-1.5 text-center text-[11px] font-semibold transition-colors duration-300 ${
                              selected
                                ? "border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/30"
                                : "border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                            }`}
                          >
                            {slot}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-1.5">
                  <FormInput value={formFilled ? "Lucía Fernández" : ""} placeholder="Nombre y apellido" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <FormInput value={formFilled ? "lucia@gmail.com" : ""} placeholder="Email" />
                    <FormInput value={formFilled ? "11 5512-3344" : ""} placeholder="Teléfono" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
              Resumen
            </p>
            <div className="mt-1.5 divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
              <SummaryRow
                label="Servicio"
                value={selectedService?.name ?? "Pendiente"}
                muted={!selectedService}
              />
              <SummaryRow
                label="Profesional"
                value={selectedService ? "Sofia Ramos" : "Pendiente"}
                muted={!selectedService}
              />
              <SummaryRow
                label="Fecha"
                value={selectedSlot ? `Mar 13, ${selectedSlot}` : "Pendiente"}
                muted={!selectedSlot}
              />
              <SummaryRow
                label="Total"
                value={selectedService ? selectedService.price : "Pendiente"}
                muted={!selectedService}
                strong
              />
              <SummaryRow
                label="Pagás ahora"
                value={selectedService ? selectedService.deposit : "Pendiente"}
                muted={!selectedService}
              />
            </div>

            <div
              className={`relative mt-3 overflow-hidden rounded-md py-2 text-center text-xs font-semibold text-white shadow-md transition-all duration-500 ${
                confirmed
                  ? "bg-emerald-500 shadow-emerald-500/30"
                  : "bg-gradient-to-r from-sky-500 to-emerald-500 shadow-sky-500/30"
              }`}
            >
              <span
                className={`block transition-opacity duration-300 ${
                  confirmed ? "opacity-0" : "opacity-100"
                }`}
              >
                Reservar y pagar seña
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center gap-1.5 transition-opacity duration-300 ${
                  confirmed ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden={!confirmed}
              >
                <CheckIcon className="h-3.5 w-3.5" />
                Reserva confirmada
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepChip({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  const highlighted = active || done;
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors duration-300 ${
        highlighted
          ? "border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/40"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold transition-colors duration-300 ${
          highlighted ? "bg-sky-500 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
        }`}
      >
        {done ? <CheckIcon className="h-2.5 w-2.5" /> : n}
      </span>
      <span
        className={`truncate text-[10px] font-medium ${
          highlighted ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted = false,
  strong = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span
        key={value}
        className={`animate-fade-in text-right text-[11px] ${
          muted
            ? "text-zinc-400"
            : strong
              ? "font-semibold text-zinc-950 dark:text-zinc-50"
              : "font-medium text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function FormInput({ value, placeholder }: { value: string; placeholder: string }) {
  const filled = value.length > 0;
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] dark:border-zinc-800 dark:bg-zinc-950">
      <span
        key={value || placeholder}
        className={`block animate-fade-in truncate ${
          filled ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
        }`}
      >
        {filled ? value : placeholder}
      </span>
    </div>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CalendarMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-sky-500">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="7" strokeLinecap="round" />
    </svg>
  );
}
