"use client";
import { useEffect } from "react";

export function PwaRegister(): null {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/mobile" }).catch(() => {});
  }, []);
  return null;
}
