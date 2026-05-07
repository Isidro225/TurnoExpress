import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PriorServiceForm } from "../PriorServiceForm";
import { updatePriorService } from "../actions";

export default async function EditPriorServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const [item, tenant] = await Promise.all([
    prisma.priorService.findFirst({ where: { id, tenantId } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { businessType: true } }),
  ]);
  if (!item || tenant?.businessType !== "nails") notFound();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Editar servicio previo</h1>
      <PriorServiceForm
        action={updatePriorService.bind(null, item.id)}
        initial={{
          name: item.name,
          removalMin: item.removalMin,
          active: item.active,
        }}
        submitLabel="Guardar"
      />
    </div>
  );
}
