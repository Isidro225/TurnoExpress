import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PriorServiceForm } from "../PriorServiceForm";
import { createPriorService } from "../actions";

export default async function NewPriorServicePage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { businessType: true },
  });
  if (tenant?.businessType !== "nails") notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Nuevo servicio previo</h1>
      <PriorServiceForm action={createPriorService} submitLabel="Crear" />
    </div>
  );
}
