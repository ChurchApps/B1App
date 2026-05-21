"use client";
import { useEffect } from "react";
import { InstallPromptHelper } from "@/helpers";

export function PwaRegister(): null {
  useEffect(() => {
    InstallPromptHelper.start();
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const allowDevPwa = process.env.NEXT_PUBLIC_ENABLE_PWA_DEV === "true";
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev && !allowDevPwa) return;

    let cancelled = false;
    const serviceWorkerPath = isDev ? "/dev-sw.js" : "/sw.js";
    const register = async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration("/");
        if (existing) {
          const existingScript = existing.active?.scriptURL || existing.waiting?.scriptURL || existing.installing?.scriptURL || "";
          if (!existingScript.endsWith(serviceWorkerPath)) {
            await existing.unregister();
          } else {
            await existing.update().catch((): void => {});
            return;
          }
        }

        await navigator.serviceWorker.register(serviceWorkerPath, { scope: "/", updateViaCache: "none" });
      } catch (error) {
        if (!cancelled) console.error("[pwa] service worker registration failed:", error);
      }
    };

    register();
    return () => { cancelled = true; };
  }, []);
  return null;
}
