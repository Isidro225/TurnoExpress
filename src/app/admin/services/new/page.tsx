import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ServiceForm } from "../ServiceForm";
import { createService } from "../actions";

export default async function NewServicePage() {
  const session = await auth();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session!.user.tenantId! },
    select: { businessType: true },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Nuevo servicio</h1>
      <ServiceForm
        action={createService}
        isNails={tenant?.businessType === "nails"}
        submitLabel="Crear"
      />
    </div>
  );
}
