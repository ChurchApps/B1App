import { useEffect } from "react";

// The browser's native jump-to-fragment happens during initial load; anything that renders
// or re-renders page content afterwards (locale init, client-fetched elements) can strand it.
export function useHashScroll(ready: boolean) {
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    let timer = 0;
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    const deadline = Date.now() + 2000;
    const attempt = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView();
      else if (Date.now() < deadline) timer = window.setTimeout(attempt, 100);
    };
    requestAnimationFrame(() => requestAnimationFrame(attempt));

    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchmove", cancel, { passive: true });
    window.addEventListener("keydown", cancel);
    return () => {
      cancel();
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchmove", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, [ready]);
}
