"use client";

import { useEffect, useState } from "react";

type Props = {
  startHour: number;
  endHour: number;
  hourHeight: number;
};

export function NowLine({ startHour, endHour, hourHeight }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const initialId = window.setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.clearTimeout(initialId);
      clearInterval(id);
    };
  }, []);

  if (!now) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMin = startHour * 60;
  const endMin = endHour * 60;
  if (minutes < startMin || minutes > endMin) return null;
  const top = ((minutes - startMin) / 60) * hourHeight;

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20"
      style={{ top: `${top}px` }}
      aria-hidden
    >
      <div className="relative">
        <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-sky-500 ring-2 ring-white dark:ring-zinc-900" />
        <div className="h-0.5 bg-sky-500" />
      </div>
    </div>
  );
}
