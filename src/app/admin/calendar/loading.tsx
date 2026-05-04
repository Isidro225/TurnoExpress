export default function CalendarLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-14 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
      <div className="hidden h-[800px] animate-pulse rounded-xl border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900" />
      <div className="h-96 animate-pulse rounded-xl border border-zinc-200 bg-white md:hidden dark:border-zinc-800 dark:bg-zinc-900" />
    </div>
  );
}
