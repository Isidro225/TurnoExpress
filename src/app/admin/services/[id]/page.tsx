import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ServiceForm } from "../ServiceForm";
import { updateService } from "../actions";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const service = await prisma.service.findFirst({ where: { id, tenantId } });
  if (!service) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Editar servicio</h1>
      <ServiceForm
        action={updateService.bind(null, service.id)}
        initial={{
          name: service.name,
          description: service.description,
          durationMin: service.durationMin,
          priceCents: service.priceCents,
          depositPct: service.depositPct,
          active: service.active,
        }}
        submitLabel="Guardar"
      />
    </div>
  );
}
