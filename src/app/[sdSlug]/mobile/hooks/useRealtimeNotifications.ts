"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiHelper, NotificationService, SocketHelper } from "@churchapps/apphelper";
import type { UserContextInterface } from "@churchapps/helpers";
import { getSocketDiagnostics, formatNotificationError, AppBadgeHelper } from "@/helpers";

interface Counts {
  notificationCount: number;
  pmCount: number;
}

interface InitDiagnostics {
  mode: "idle" | "realtime" | "fallback" | "local-only" | "error";
  message: string;
  socketState: string;
}

const EMPTY_COUNTS: Counts = { notificationCount: 0, pmCount: 0 };

export const useRealtimeNotifications = (context: UserContextInterface | null | undefined) => {
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<InitDiagnostics>({
    mode: "idle",
    message: "Notification service has not initialized yet.",
    socketState: "UNINITIALIZED"
  });

  const notificationService = useMemo(() => NotificationService.getInstance(), []);
  const personId = context?.person?.id;
  const churchId = context?.userChurch?.church?.id;
  const hasJwt = !!context?.userChurch?.jwt;
  const socketInfo = getSocketDiagnostics();
  const allowRealtime = process.env.NEXT_PUBLIC_ENABLE_NOTIFICATION_SOCKET === "true";

  const loadCountsFallback = useCallback(async () => {
    const response = await ApiHelper.get("/notifications/unreadCount", "MessagingApi");
    setCounts({
      notificationCount: Number(response?.notificationCount || 0),
      pmCount: Number(response?.pmCount || 0)
    });
  }, []);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newCounts) => {
      setCounts(newCounts);
    });
    return () => unsubscribe();
  }, [notificationService]);

  // Keep the home-screen app icon badge (Badging API) in sync with the live unread total.
  // No-op on platforms without badge support; reconciles the count set by the SW push handler.
  useEffect(() => {
    AppBadgeHelper.setAppBadge((counts?.notificationCount || 0) + (counts?.pmCount || 0));
  }, [counts]);

  useEffect(() => {
    if (!personId || !churchId) {
      setIsLoading(false);
      setError(null);
      setCounts(EMPTY_COUNTS);
      setDiagnostics({
        mode: "idle",
        message: "Notification service is waiting for authenticated person/church context.",
        socketState: SocketHelper.getConnectionState()
      });
      return;
    }

    let cancelled = false;

    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      if (!allowRealtime) {
        try {
          await loadCountsFallback();
          if (cancelled) return;
          setDiagnostics({
            mode: "local-only",
            message: "Realtime notification socket is disabled in this app build. Using API-only unread counts.",
            socketState: "DISABLED"
          });
        } catch (fallbackError) {
          if (cancelled) return;
          const details = formatNotificationError(fallbackError);
          setError(details.message);
          setDiagnostics({
            mode: "error",
            message: details.summary,
            socketState: "DISABLED"
          });
          console.error("[notifications] Failed to load counts while realtime socket is disabled:", details);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
        return;
      }

      if (!socketInfo.valid || !socketInfo.compatible) {
        try {
          await loadCountsFallback();
          if (cancelled) return;
          const reason = socketInfo.reason || "Realtime socket unavailable.";
          setDiagnostics({
            mode: "fallback",
            message: reason,
            socketState: SocketHelper.getConnectionState()
          });
        } catch (fallbackError) {
          if (cancelled) return;
          const details = formatNotificationError(fallbackError);
          setError(details.message);
          setDiagnostics({
            mode: "error",
            message: details.summary,
            socketState: SocketHelper.getConnectionState()
          });
          console.error("[notifications] Failed to load counts in fallback mode:", details);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
        return;
      }

      try {
        await notificationService.initialize(context);
        if (cancelled) return;
        setDiagnostics({
          mode: "realtime",
          message: "Realtime notification socket initialized successfully.",
          socketState: SocketHelper.getConnectionState()
        });
      } catch (initError) {
        if (cancelled) return;
        const details = formatNotificationError(initError);
        setError(details.message);
        try {
          await loadCountsFallback();
          if (cancelled) return;
          setDiagnostics({
            mode: "fallback",
            message: `${details.summary}. Falling back to API-only counts.`,
            socketState: SocketHelper.getConnectionState()
          });
        } catch (fallbackError) {
          const fallbackDetails = formatNotificationError(fallbackError);
          setDiagnostics({
            mode: "error",
            message: fallbackDetails.summary,
            socketState: SocketHelper.getConnectionState()
          });
          console.error("[notifications] Fallback count load failed:", {
            initError: details,
            fallbackError: fallbackDetails
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initialize();
    return () => { cancelled = true; };
  }, [
    allowRealtime, churchId, hasJwt, loadCountsFallback, notificationService, personId, socketInfo.compatible, socketInfo.reason, socketInfo.valid
  ]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      if (diagnostics.mode === "realtime" && socketInfo.valid && socketInfo.compatible) {
        await notificationService.refresh();
      } else {
        await loadCountsFallback();
      }
      setDiagnostics((prev) => ({ ...prev, socketState: SocketHelper.getConnectionState() }));
    } catch (refreshError) {
      const details = formatNotificationError(refreshError);
      setError(details.message);
      setDiagnostics({
        mode: "error",
        message: details.summary,
        socketState: SocketHelper.getConnectionState()
      });
      console.error("[notifications] Refresh failed:", details);
    }
  }, [diagnostics.mode, loadCountsFallback, notificationService, socketInfo.compatible, socketInfo.valid]);

  return {
    counts,
    isLoading,
    isReady: diagnostics.mode === "realtime" ? notificationService.isReady() : diagnostics.mode !== "error",
    refresh,
    error,
    diagnostics,
    socketInfo
  };
};
