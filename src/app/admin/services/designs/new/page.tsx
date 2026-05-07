import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DesignForm } from "../DesignForm";
import { createDesign } from "../actions";

export default async function NewDesignPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { businessType: true },
  });
  if (tenant?.businessType !== "nails") notFound();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Nuevo diseño</h1>
      <DesignForm action={createDesign} submitLabel="Crear" />
    </div>
  );
}
