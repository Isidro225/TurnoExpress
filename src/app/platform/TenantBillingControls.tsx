"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BILLING_PLANS,
  BILLING_PLAN_VALUES,
  type BillingPlanId,
} from "@/lib/billing-plans";
import { updateTenantBilling } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  trialing: "En prueba",
  pending: "Pendiente",
  active: "Activo",
  paused: "Pausado",
  cancelled: "Cancelado",
  past_due: "Pago vencido",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function TenantBillingControls({
  tenantId,
  planId,
  billingStatus,
  statusOptions,
}: {
  tenantId: string;
  planId: BillingPlanId;
  billingStatus: string;
  statusOptions: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const returnTo = qs ? `${pathname}?${qs}` : pathname;

  function submitChange() {
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={updateTenantBilling} className="space-y-2">
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="flex gap-2">
        <select
          name="billingPlan"
          defaultValue={planId}
          onChange={submitChange}
          className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
        >
          {BILLING_PLAN_VALUES.map((value) => (
            <option key={value} value={value}>
              {BILLING_PLANS[value].name}
            </option>
          ))}
        </select>
        <select
          name="billingStatus"
          defaultValue={billingStatus}
          onChange={submitChange}
          className="w-32 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
        >
          {statusOptions.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value)}
            </option>
          ))}
        </select>
      </div>
      <SaveButton />
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-700 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Guardando..." : "Guardar"}
    </button>
  );
}
