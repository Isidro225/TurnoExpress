"use client";

import { useEffect } from "react";

const MAX_BLUR_PX = 3;
const MAX_OPACITY_DROP = 0.35;
const FALLOFF_RATIO = 0.4;

export function ScrollFocusManager() {
  useEffect(() => {
    let raf = 0;
    const lastValues = new WeakMap<HTMLElement, string>();

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const viewportCenter = vh / 2;
      const falloff = vh * FALLOFF_RATIO;

      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("[data-scroll-focus]")
      );

      const measured = nodes.map((el) => ({ el, rect: el.getBoundingClientRect() }));

      for (const { el, rect } of measured) {
        if (rect.bottom < -200 || rect.top > vh + 200) continue;

        let distance = 0;
        if (viewportCenter < rect.top) distance = rect.top - viewportCenter;
        else if (viewportCenter > rect.bottom) distance = viewportCenter - rect.bottom;

        const t = Math.min(distance / falloff, 1);
        const blur = t * MAX_BLUR_PX;
        const opacity = 1 - t * MAX_OPACITY_DROP;

        const filterStr = blur < 0.05 ? "" : `blur(${blur.toFixed(2)}px)`;
        const opacityStr = opacity > 0.999 ? "" : opacity.toFixed(3);
        const key = `${filterStr}|${opacityStr}`;
        if (lastValues.get(el) === key) continue;
        lastValues.set(el, key);
        el.style.filter = filterStr;
        el.style.opacity = opacityStr;
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
