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
    const delay =
      phase === "holding" ? HOLD_MS : phase === "deleting" ? DELETE_MS : TYPE_MS;

    const t = setTimeout(() => {
      if (phase === "holding") {
        setPhase("deleting");
        return;
      }

      if (phase === "deleting") {
        if (text.length === 0) {
          setIdx((i) => (i + 1) % PHRASES.length);
          setPhase("typing");
          return;
        }
        setText(text.slice(0, -1));
        return;
      }

      const target = PHRASES[idx];
      if (text === target) {
        setPhase("holding");
        return;
      }
      setText(target.slice(0, text.length + 1));
    }, delay);

    return () => clearTimeout(t);
  }, [phase, text, idx]);

  return (
    <span className="inline-grid align-baseline">
      {PHRASES.map((phrase) => (
        <span
          key={phrase}
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 inline-flex items-baseline whitespace-nowrap"
        >
          <span>{phrase}</span>
          <span className="ml-0.5 inline-block h-[0.85em] w-[3px]" />
        </span>
      ))}
      <span className="col-start-1 row-start-1 inline-flex items-baseline whitespace-nowrap">
        <span className="bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent">
          {text || "\u00a0"}
        </span>
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[0.85em] w-[3px] translate-y-[2px] rounded-sm bg-sky-500 animate-cursor-blink"
        />
      </span>
    </span>
  );
}
