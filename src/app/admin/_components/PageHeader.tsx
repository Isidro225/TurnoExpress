import Link from "next/link";

type Action =
  | {
      kind: "primary";
      label: string;
      href: string;
      icon?: React.ReactNode;
    }
  | {
      kind: "secondary";
      label: string;
      href: string;
      icon?: React.ReactNode;
    };

type Props = {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href: string }[];
  actions?: Action[];
};

export function PageHeader({ title, description, breadcrumbs, actions }: Props) {
  return (
    <header className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500" aria-label="Migas">
          {breadcrumbs.map((b, i) => (
            <span key={b.href} className="inline-flex items-center gap-1.5">
              <Link
                href={b.href}
                className="transition hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                {b.label}
              </Link>
              {i < breadcrumbs.length - 1 && <span className="text-zinc-400">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          )}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((a) =>
              a.kind === "primary" ? (
                <Link
                  key={a.label}
                  href={a.href}
                  className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-500/25 transition hover:shadow-md hover:shadow-sky-500/40"
                >
                  {a.icon}
                  {a.label}
                </Link>
              ) : (
                <Link
                  key={a.label}
                  href={a.href}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {a.icon}
                  {a.label}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </header>
  );
}
