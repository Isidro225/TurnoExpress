import Link from "next/link";

type Props = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 text-sky-600 dark:from-sky-950/60 dark:to-emerald-950/60 dark:text-sky-300">
        {icon}
      </div>
      <p className="text-base font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-zinc-500">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-500/25 transition hover:shadow-md hover:shadow-sky-500/40"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
