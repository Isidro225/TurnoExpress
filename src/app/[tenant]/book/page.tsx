import { redirect } from "next/navigation";

// La pantalla de reserva ahora vive en /[tenant]. Mantenemos esta ruta como
// redirect para no romper bookmarks ni los back_urls de Mercado Pago de versiones
// previas. Los sub-routes /book/success, /book/failure y /book/pending siguen
// activos porque son los `back_urls` que usa MP al redirigir.
export default async function BookRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { tenant } = await params;
  const sp = await searchParams;
  const dest = sp.service ? `/${tenant}?service=${sp.service}` : `/${tenant}`;
  redirect(dest);
}
