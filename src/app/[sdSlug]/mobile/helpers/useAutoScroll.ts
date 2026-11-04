"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  enabled: boolean;
  intervalMs?: number;
  resumeMs?: number;
}

// Real tiles are the strip's children; copies of the first tiles that follow them carry data-clone.
const realTiles = (el: HTMLElement) => Array.from(el.children).filter((c) => !(c as HTMLElement).dataset.clone) as HTMLElement[];
const tileStep = (el: HTMLElement) => {
  const first = realTiles(el)[0];
  return (first?.offsetWidth || el.clientWidth) + (parseFloat(getComputedStyle(el).columnGap) || 0);
};
// Distance from the first real tile to the first copy, i.e. where the strip looks like it did at the start.
const wrapPoint = (el: HTMLElement) => {
  const first = el.firstElementChild as HTMLElement | null;
  const clone = el.querySelector(":scope > [data-clone]") as HTMLElement | null;
  return first && clone ? clone.offsetLeft - first.offsetLeft : 0;
};

// Steps a sideways strip forward one card at a time. When the strip has copies of its first cards after the
// last one, it scrolls into them and then jumps back to the real first card with no animation, so the loop
// always moves forward. Pauses while it is hovered, touched or focused, and stays still when the device asks
// for reduced motion. Takes the element (keep it in state via a callback ref, since strips mount after data loads).
// Returns whether the strip is moving, the index of the card at the left edge, and goTo(i) for pagination dots.
export const useAutoScroll = (el: HTMLElement | null, { enabled, intervalMs = 4000, resumeMs = 5000 }: Options) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [index, setIndex] = useState(0);
  const holdRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const active = enabled && !reducedMotion;

  // Tracks the current card and wraps out of the copies, whether the strip got there by itself or by a swipe.
  useEffect(() => {
    if (!el) return;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const settle = () => {
      const wrap = wrapPoint(el);
      if (wrap > 0 && el.scrollLeft >= wrap - 1) el.scrollTo({ left: el.scrollLeft - wrap, behavior: "instant" });
    };
    const hasScrollEnd = "onscrollend" in window;
    const onScroll = () => {
      const count = realTiles(el).length || 1;
      setIndex(Math.round(el.scrollLeft / tileStep(el)) % count);
      if (!hasScrollEnd) {
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(settle, 150);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    if (hasScrollEnd) el.addEventListener("scrollend", settle);
    return () => {
      if (settleTimer) clearTimeout(settleTimer);
      el.removeEventListener("scroll", onScroll);
      if (hasScrollEnd) el.removeEventListener("scrollend", settle);
    };
  }, [el]);

  useEffect(() => {
    if (!active || !el) return;
    let paused = false;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (paused || document.visibilityState !== "visible") return;
      if (el.scrollWidth <= el.clientWidth) return;
      // Without copies to scroll into there is nowhere further to go.
      if (!wrapPoint(el) && el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) return;
      el.scrollBy({ left: tileStep(el), behavior: "smooth" });
    };

    const pause = () => {
      paused = true;
      if (resumeTimer) clearTimeout(resumeTimer);
    };
    const resume = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, resumeMs);
    };
    holdRef.current = () => { pause(); resume(); };

    const pauseEvents = ["pointerenter", "touchstart", "focusin"] as const;
    const resumeEvents = ["pointerleave", "touchend", "focusout"] as const;
    pauseEvents.forEach((e) => el.addEventListener(e, pause, { passive: true }));
    resumeEvents.forEach((e) => el.addEventListener(e, resume, { passive: true }));
    const interval = setInterval(tick, intervalMs);

    return () => {
      clearInterval(interval);
      if (resumeTimer) clearTimeout(resumeTimer);
      holdRef.current = () => {};
      pauseEvents.forEach((e) => el.removeEventListener(e, pause));
      resumeEvents.forEach((e) => el.removeEventListener(e, resume));
    };
  }, [active, el, intervalMs, resumeMs]);

  // Holds the strip on the chosen card for resumeMs before it starts moving again.
  const goTo = useCallback((i: number) => {
    if (!el) return;
    holdRef.current();
    el.scrollTo({ left: i * tileStep(el), behavior: "smooth" });
  }, [el]);

  return { active, index, goTo };
};
