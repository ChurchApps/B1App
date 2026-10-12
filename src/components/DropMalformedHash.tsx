"use client";

import { useLayoutEffect } from "react";

// Stripe.js and the Maps loader decode location.hash and throw on a broken
// percent-escape. Clear it before their effects insert those scripts.
export function DropMalformedHash() {
  useLayoutEffect(() => {
    const raw = window.location.hash.slice(1);
    if (!raw) return;
    try {
      decodeURIComponent(raw);
    } catch {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);
  return null;
}
