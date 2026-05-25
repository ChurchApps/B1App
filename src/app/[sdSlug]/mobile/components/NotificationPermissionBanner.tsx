"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Icon, Typography } from "@mui/material";
import { mobileTheme } from "./mobileTheme";
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

  const handleEnable = async () => {
    if (WebPushHelper.requiresInstallForPush()) {
      router.push("/mobile/install");
      return;
    }

    setBusy(true);
    try {
      const subscription = await WebPushHelper.subscribe();
      if (!subscription && WebPushHelper.getPermissionState() === "granted") {
        throw new Error("Permission granted, but device registration did not complete.");
      }
    } catch (error) {
      console.error("[webpush] dashboard enable failed:", error);
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  if (!enabled || loading || diagnostics.permission === "unsupported") return null;

  const installRequired = WebPushHelper.requiresInstallForPush();
  let tone = {
    background: "rgba(13, 71, 161, 0.08)",
    border: "rgba(13, 71, 161, 0.22)",
    icon: tc.primary
  };
  let iconName = "notifications_active";
  let title = "";
  let body = "";
  let primaryLabel = "";
  let primaryAction: (() => void | Promise<void>) | null = null;

  if (diagnostics.permission === "denied") {
    tone = {
      background: "rgba(239, 68, 68, 0.10)",
      border: "rgba(239, 68, 68, 0.28)",
      icon: "#dc2626"
    };
    iconName = "notifications_off";
    title = "Enable notifications in your browser";
    body = "Notifications are currently blocked. Open your browser or device site settings, allow notifications for this app, then return here.";
    primaryLabel = "View Notification Settings";
    primaryAction = () => router.push("/mobile/notifications");
  } else if (diagnostics.permission !== "granted" && installRequired) {
    title = "Install app to enable notifications";
    body = "On iPhone, notifications work after the app is added to your Home Screen. Install the app, then return and allow notifications.";
    primaryLabel = "Install App";
    primaryAction = () => router.push("/mobile/install");
  } else if (diagnostics.permission !== "granted") {
    title = "Turn on notifications";
    body = "Get alerts for new messages, group updates, and reminders. Tap Enable Notifications, then choose Allow when asked.";
    primaryLabel = busy ? "Enabling..." : "Enable Notifications";
    primaryAction = busy ? null : handleEnable;
  } else if (!diagnostics.hasSubscription || (diagnostics.serverRegistrationEnabled && !diagnostics.hasConfirmedServerEnrollment)) {
    if (installRequired) {
      title = "Install app to finish notifications";
      body = "This device has permission, but iPhone push notifications need the installed app experience to complete setup.";
      primaryLabel = "Install App";
      primaryAction = () => router.push("/mobile/install");
    } else {
      title = "Finish notification setup";
      body = "Notifications are allowed, but this device still needs to register for alerts. Try again now.";
      primaryLabel = busy ? "Retrying..." : "Retry Registration";
      primaryAction = busy ? null : handleEnable;
    }
  } else {
    return null;
  }

  return (
    <Box
      sx={{
        mx: `${mobileTheme.spacing.md}px`,
        mb: 2.5,
        p: "14px 16px",
        borderRadius: `${mobileTheme.radius.lg}px`,
        bgcolor: tone.background,
        border: `1px solid ${tone.border}`,
        display: "flex",
        gap: 1.5,
        alignItems: "flex-start"
      }}
    >
      <Icon sx={{ color: tone.icon, fontSize: 22, mt: "2px" }}>{iconName}</Icon>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: tc.text, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 13, lineHeight: "18px", color: tc.textMuted }}>
          {body}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
          {primaryAction && (
            <Button size="small" variant="contained" onClick={() => { void primaryAction(); }} disabled={busy}>
              {primaryLabel}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};
