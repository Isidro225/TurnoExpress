import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getTenantBySlug, isReservedSlug } from "@/lib/tenant";

const DEFAULT_BRAND = "#0ea5e9";

export default async function TenantLayout({
  params,
  children,
}: {
  params: Promise<{ tenant: string }>;
  children: React.ReactNode;
}) {
  const { tenant: slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const tenant = await getTenantBySlug(slug);
  if (!tenant?.active) notFound();

  const brand = tenant.primaryColor ?? DEFAULT_BRAND;
  const bgChoice = (tenant.backgroundColor ?? "white") as "white" | "gray" | "black";
  const BG_HEX: Record<typeof bgChoice, string> = {
    white: "#ffffff",
    gray: "#e4e4e7",
    black: "#09090b",
  };
  const isDark = bgChoice === "black";

  const wrapperStyle: CSSProperties = {
    ["--brand" as string]: brand,
    backgroundColor: BG_HEX[bgChoice],
  };

  return (
    <div
      style={wrapperStyle}
      className={`min-h-screen ${isDark ? "dark text-zinc-100" : "text-zinc-900"}`}
    >
      <header
        className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        style={{ borderTop: `4px solid ${brand}` }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-5">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- soportamos data URIs sin pasar por next/image
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-14 w-14 rounded-md object-cover"
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: brand }}
            >
              <span className="text-xl font-semibold">
                {tenant.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <Link href={`/${tenant.slug}`} className="text-xl font-semibold">
              {tenant.name}
            </Link>
            {tenant.description && (
              <p className="text-sm text-zinc-500">{tenant.description}</p>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
