import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DesignForm } from "../DesignForm";
import { updateDesign } from "../actions";

export default async function EditDesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const [item, tenant] = await Promise.all([
    prisma.design.findFirst({ where: { id, tenantId } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { businessType: true } }),
  ]);
  if (!item || tenant?.businessType !== "nails") notFound();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Editar diseño</h1>
      <DesignForm
        action={updateDesign.bind(null, item.id)}
        initial={{
          name: item.name,
          durationMin: item.durationMin,
          priceCents: item.priceCents,
          active: item.active,
        }}
        submitLabel="Guardar"
      />
    </div>
  );
}
