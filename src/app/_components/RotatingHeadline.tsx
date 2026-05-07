"use client";

import { useEffect, useState } from "react";

const PHRASES = ["listo en minutos", "hecho para vos", "para tu negocio"];
const TYPE_MS = 55;
const DELETE_MS = 28;
const HOLD_MS = 1800;

type Phase = "holding" | "deleting" | "typing";

export function RotatingHeadline() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState(PHRASES[0]);
  const [phase, setPhase] = useState<Phase>("holding");

  useEffect(() => {
    if (phase === "holding") {
      const t = setTimeout(() => setPhase("deleting"), HOLD_MS);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (text.length === 0) {
        setIdx((i) => (i + 1) % PHRASES.length);
        setPhase("typing");
        return;
      }
      const t = setTimeout(() => setText(text.slice(0, -1)), DELETE_MS);
      return () => clearTimeout(t);
    }

    // typing
    const target = PHRASES[idx];
    if (text === target) {
      setPhase("holding");
      return;
    }
    const t = setTimeout(
      () => setText(target.slice(0, text.length + 1)),
      TYPE_MS
    );
    return () => clearTimeout(t);
  }, [phase, text, idx]);

  return (
    <span className="inline-flex items-baseline">
      <span className="bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent">
        {text || " "}
      </span>
      <span
        aria-hidden
        className="ml-0.5 inline-block h-[0.85em] w-[3px] translate-y-[2px] rounded-sm bg-sky-500 animate-cursor-blink"
      />
    </span>
  );
}
