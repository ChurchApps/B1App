"use client";

import { useContext, useEffect, useRef } from "react";
import UserContext from "@/context/UserContext";
import { WebPushHelper } from "@/helpers";

export const WebPushEnrollmentSync = (): null => {
  const context = useContext(UserContext);
  const userId = context?.user?.id;
  const churchId = context?.userChurch?.church?.id;
  const jwt = context?.userChurch?.jwt;
  const lastEnrollmentKeyRef = useRef<string>("");

  useEffect(() => {
    const syncEnrollment = async () => {
      if (!userId || !churchId || !jwt) return;
      if (!WebPushHelper.isSupported()) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

      const enrollmentKey = `${userId}:${churchId}:${Notification.permission}:${WebPushHelper.isServerRegistrationEnabled() ? "server" : "local"}`;
      if (lastEnrollmentKeyRef.current === enrollmentKey) return;

      try {
        const existing = await WebPushHelper.getExistingSubscription();
        if (existing && WebPushHelper.isServerRegistrationEnabled()) {
          await WebPushHelper.refreshEnrollment();
        } else {
          await WebPushHelper.subscribe();
        }
        lastEnrollmentKeyRef.current = enrollmentKey;
      } catch (error) {
        console.error("[webpush] background enrollment sync failed:", error);
      }
    };

    syncEnrollment();
  }, [churchId, jwt, userId]);

  return null;
};
