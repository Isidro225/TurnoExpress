"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  format?: (value: number) => string;
};

export function CountUp({
  to,
  from = 0,
  duration = 1400,
  className,
  format,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(from);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(from + (to - from) * eased);
            if (t < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          break;
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [from, to, duration]);

  const display = format ? format(value) : Math.round(value).toString();
  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
