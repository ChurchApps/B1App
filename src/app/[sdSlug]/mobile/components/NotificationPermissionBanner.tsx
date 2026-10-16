"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Typography } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { mobileTheme } from "./mobileTheme";
import { PlateSection } from "./kit";
import { useNotificationDiagnostics } from "../hooks/useNotificationDiagnostics";
import { WebPushHelper } from "@/helpers";

interface Props {
  enabled: boolean;
}

export const NotificationPermissionBanner = ({ enabled }: Props) => {
  const router = useRouter();
  const tc = mobileTheme.colors;
  const { diagnostics, loading, refresh } = useNotificationDiagnostics(enabled);
  const [busy, setBusy] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleEnable = async () => {
    if (WebPushHelper.requiresInstallForPush()) {
      router.push("/mobile/install");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    try {
      const subscription = await WebPushHelper.subscribe();
      if (!subscription && WebPushHelper.getPermissionState() === "granted") {
        throw new Error(Locale.label("mobile.notificationBanner.registrationIncomplete"));
      }
    } catch (error) {
      console.error("[webpush] dashboard enable failed:", error);
      setErrorMessage((error as Error)?.message || Locale.label("mobile.components.notificationEnableFailed"));
    } finally {
      setBusy(false);
      await refresh().catch(() => { /* ignore */ });
    }
  };

  if (!enabled || loading || diagnostics.permission === "unsupported") return null;

  const installRequired = WebPushHelper.requiresInstallForPush();
  let title = "";
  let body = "";
  let primaryLabel = "";
  let primaryAction: (() => void | Promise<void>) | null = null;

  if (diagnostics.permission === "denied") {
    title = Locale.label("mobile.notificationBanner.blockedTitle");
    body = Locale.label("mobile.notificationBanner.blockedBody").replace("{}", WebPushHelper.getUnblockInstructions());
    primaryLabel = Locale.label("mobile.notificationBanner.viewSettings");
    primaryAction = () => router.push("/mobile/notifications");
  } else if (diagnostics.permission !== "granted" && installRequired) {
    title = Locale.label("mobile.notificationBanner.installTitle");
    body = Locale.label("mobile.notificationBanner.installBody");
    primaryLabel = Locale.label("mobile.notificationBanner.installApp");
    primaryAction = () => router.push("/mobile/install");
  } else if (diagnostics.permission !== "granted") {
    title = Locale.label("mobile.notificationBanner.enableTitle");
    body = Locale.label("mobile.notificationBanner.enableBody");
    primaryLabel = busy ? Locale.label("mobile.notificationBanner.enabling") : Locale.label("mobile.notificationBanner.enableButton");
    primaryAction = busy ? null : handleEnable;
  } else if (!diagnostics.hasSubscription || (diagnostics.serverRegistrationEnabled && !diagnostics.hasConfirmedServerEnrollment)) {
    if (installRequired) {
      title = Locale.label("mobile.notificationBanner.installFinishTitle");
      body = Locale.label("mobile.notificationBanner.installFinishBody");
      primaryLabel = Locale.label("mobile.notificationBanner.installApp");
      primaryAction = () => router.push("/mobile/install");
    } else {
      title = Locale.label("mobile.notificationBanner.finishTitle");
      body = Locale.label("mobile.notificationBanner.finishBody");
      primaryLabel = busy ? Locale.label("mobile.notificationBanner.retrying") : Locale.label("mobile.notificationBanner.retryButton");
      primaryAction = busy ? null : handleEnable;
    }
  } else {
    return null;
  }

  return (
    <PlateSection title={Locale.label("mobile.components.notifications")}>
      <Typography sx={{ fontSize: 15, lineHeight: "21px", fontWeight: 600, color: tc.text }}>{title}</Typography>
      <Typography sx={{ mt: "2px", fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>{body}</Typography>
      {primaryAction && (
        <Button
          variant={diagnostics.permission === "denied" ? "outlined" : "contained"}
          size="small"
          onClick={() => { void primaryAction(); }}
          disabled={busy}
          sx={{ mt: "12px" }}
        >
          {primaryLabel}
        </Button>
      )}
      {errorMessage && <Typography sx={{ fontSize: 13, color: tc.error, mt: 1 }}>{errorMessage}</Typography>}
    </PlateSection>
  );
};
