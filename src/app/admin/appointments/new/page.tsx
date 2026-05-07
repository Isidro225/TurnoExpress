import { format } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantPlanUsage } from "@/lib/plan-limits";
import { PageHeader } from "../../_components/PageHeader";
import { PlanLimitNotice } from "../../_components/PlanUsage";
import { createAppointment } from "../actions";
import {
  AppointmentForm,
  type DesignOption,
  type PriorServiceOption,
  type ServiceOption,
  type StaffOption,
} from "./AppointmentForm";

export default async function NewAppointmentPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;

  const usage = await getTenantPlanUsage(tenantId);
  if (usage.appointmentsThisMonth.reached) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl space-y-4">
          <PageHeader title="Nuevo turno" />
          <PlanLimitNotice
            title="Llegaste al límite de turnos del mes"
            description={`Tu plan permite hasta ${usage.appointmentsThisMonth.limit} turnos por mes y ya tenés ${usage.appointmentsThisMonth.used}. Subí de plan para tomar más este mes.`}
            planName={usage.planName}
          />
        </div>
      </div>
    );
  }

  const [tenant, services, staff, priorServices, designs] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { businessType: true },
    }),
    prisma.service.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
      include: { staff: { select: { staffId: true } } },
    }),
    prisma.staff.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.priorService.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, removalMin: true },
    }),
    prisma.design.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, durationMin: true, priceCents: true },
    }),
  ]);

  const isNails = tenant?.businessType === "nails";
  const serviceOptions: ServiceOption[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    durationMin: s.durationMin,
    priceCents: s.priceCents,
    category: s.category,
    staffIds: s.staff.map((link) => link.staffId),
  }));
  const staffOptions: StaffOption[] = staff;
  const priorServiceOptions: PriorServiceOption[] = priorServices;
  const designOptions: DesignOption[] = designs;

  const now = new Date();
  const defaultDate = format(now, "yyyy-MM-dd");
  const defaultTime = format(now, "HH:mm");

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="max-w-3xl space-y-6">
        <PageHeader
          title="Nuevo turno"
          description="Cargá un turno manualmente. Queda confirmado de una, sin pasar por Mercado Pago."
        />
        <AppointmentForm
          action={createAppointment}
          isNails={isNails}
          services={serviceOptions}
          staff={staffOptions}
          priorServices={priorServiceOptions}
          designs={designOptions}
          defaultDate={defaultDate}
          defaultTime={defaultTime}
        />
      </div>
    </div>
  );
}
