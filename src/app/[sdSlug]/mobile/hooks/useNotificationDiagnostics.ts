"use client";

import { useCallback, useEffect, useState } from "react";
import { WebPushDiagnostics, WebPushHelper } from "@/helpers/WebPushHelper";

const EMPTY_DIAGNOSTICS: WebPushDiagnostics = {
  permission: "unsupported",
  isStandalone: false,
  canPromptNow: false,
  serverRegistrationEnabled: false,
  publicKeyConfigured: false,
  hasServiceWorkerRegistration: false,
  hasSubscription: false,
  hasConfirmedServerEnrollment: false,
  statusReason: null
};

export const useNotificationDiagnostics = (enabled: boolean) => {
  const [diagnostics, setDiagnostics] = useState<WebPushDiagnostics>(EMPTY_DIAGNOSTICS);
  const [loading, setLoading] = useState<boolean>(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setDiagnostics(EMPTY_DIAGNOSTICS);
      setLoading(false);
      return EMPTY_DIAGNOSTICS;
    }

    setLoading(true);
    try {
      const next = await WebPushHelper.getDiagnostics();
      setDiagnostics(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setDiagnostics(EMPTY_DIAGNOSTICS);
      setLoading(false);
      return;
    }

    refresh();

    const handleFocus = () => { void refresh(); };
    const handlePageShow = () => { void refresh(); };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, refresh]);

  return { diagnostics, loading, refresh };
};
