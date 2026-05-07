"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "../_components/AdminIcons";

type Props = {
  currentDate: string;
  staff?: string;
};

export function DateJumpButton({ currentDate, staff }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const input = inputRef.current;
          if (!input) return;
          if (typeof input.showPicker === "function") input.showPicker();
          else input.click();
        }}
        className="flex items-center px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        aria-label="Ir a una fecha"
      >
        <CalendarIcon className="h-4 w-4" />
      </button>
      <input
        ref={inputRef}
        type="date"
        defaultValue={currentDate}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const value = e.target.value;
          if (!value) return;
          const sp = new URLSearchParams();
          sp.set("date", value);
          if (staff) sp.set("staff", staff);
          router.push(`/admin/calendar?${sp.toString()}`);
        }}
      />
    </>
  );
}
