"use client";
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/my" }).catch(() => {});
  }, []);
  return null;
}
