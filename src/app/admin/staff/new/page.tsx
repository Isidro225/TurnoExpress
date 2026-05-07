import { auth } from "@/auth";
import { getTenantPlanUsage } from "@/lib/plan-limits";
import { PlanLimitNotice } from "../../_components/PlanUsage";
import { StaffForm } from "../StaffForm";
import { createStaff } from "../actions";

export default async function NewStaffPage() {
  const session = await auth();
  const usage = await getTenantPlanUsage(session!.user.tenantId!);

  if (usage.staff.reached) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-2xl font-semibold">Agregar persona</h1>
          <PlanLimitNotice
            title="Llegaste al límite de profesionales de tu plan"
            description={`Tu plan permite hasta ${usage.staff.limit} y ya tenés ${usage.staff.used}. Subí de plan para sumar más profesionales.`}
            planName={usage.planName}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Agregar persona</h1>
      <StaffForm action={createStaff} submitLabel="Crear" />
    </div>
  );
}
