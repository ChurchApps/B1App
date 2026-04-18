"use client";
import { useEffect } from "react";

export function PwaRegister(): null {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/mobile", updateViaCache: "none" })
      .catch(() => {});
  }, []);
  return null;
}
