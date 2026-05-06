import Link from "next/link";

type Tab = "services" | "prior" | "designs";

type Props = {
  active: Tab;
  showNails: boolean;
};

export function ServicesTabs({ active, showNails }: Props) {
  if (!showNails) return null;

  const tabClass = (tab: Tab) =>
    `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
      active === tab
        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  return (
    <div className="mb-6 inline-flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
      <Link href="/admin/services" className={tabClass("services")}>
        Servicios
      </Link>
      <Link href="/admin/services/prior" className={tabClass("prior")}>
        Servicios previos
      </Link>
      <Link href="/admin/services/designs" className={tabClass("designs")}>
        Diseños
      </Link>
    </div>
  );
}
