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
            if (existing.waiting) {
              try {
                existing.waiting.postMessage({ type: "B1_SKIP_WAITING" });
              } catch {
                // Ignore postMessage failures; update() still runs below.
              }
            }
            await existing.update().catch((): void => {});
            return;
          }
        }

        const registration = await navigator.serviceWorker.register(serviceWorkerPath, { scope: "/", updateViaCache: "none" });
        if (registration.waiting) {
          try {
            registration.waiting.postMessage({ type: "B1_SKIP_WAITING" });
          } catch {
            // Ignore postMessage failures; the worker will still activate on the next navigation.
          }
        }
      } catch (error) {
        if (!cancelled) console.error("[pwa] service worker registration failed:", error);
      }
    };

    const handleControllerChange = () => {
      if (cancelled) return;
      console.info("[pwa] service worker controller changed");
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    register();
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);
  return null;
}
