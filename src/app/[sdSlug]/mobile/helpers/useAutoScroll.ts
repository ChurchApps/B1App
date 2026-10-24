"use client";

import { useEffect, useState } from "react";

interface Options {
  enabled: boolean;
  intervalMs?: number;
  resumeMs?: number;
}

// Steps a sideways strip one card at a time, looping to the start at the end. Pauses while it is
// hovered, touched or focused, and stays still when the device asks for reduced motion.
// Takes the element (keep it in state via a callback ref, since strips mount after data loads).
// Returns whether the strip is actually moving.
export const useAutoScroll = (el: HTMLElement | null, { enabled, intervalMs = 4000, resumeMs = 5000 }: Options) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const active = enabled && !reducedMotion;

  useEffect(() => {
    if (!active || !el) return;
    let paused = false;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (paused || document.visibilityState !== "visible") return;
      if (el.scrollWidth <= el.clientWidth) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
      const first = el.firstElementChild as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      el.scrollBy({ left: (first?.offsetWidth || el.clientWidth) + gap, behavior: "smooth" });
    };

    const pause = () => {
      paused = true;
      if (resumeTimer) clearTimeout(resumeTimer);
    };
    const resume = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, resumeMs);
    };

    const pauseEvents = ["pointerenter", "touchstart", "focusin"] as const;
    const resumeEvents = ["pointerleave", "touchend", "focusout"] as const;
    pauseEvents.forEach((e) => el.addEventListener(e, pause, { passive: true }));
    resumeEvents.forEach((e) => el.addEventListener(e, resume, { passive: true }));
    const interval = setInterval(tick, intervalMs);

    return () => {
      clearInterval(interval);
      if (resumeTimer) clearTimeout(resumeTimer);
      pauseEvents.forEach((e) => el.removeEventListener(e, pause));
      resumeEvents.forEach((e) => el.removeEventListener(e, resume));
    };
  }, [active, el, intervalMs, resumeMs]);

  return active;
};
