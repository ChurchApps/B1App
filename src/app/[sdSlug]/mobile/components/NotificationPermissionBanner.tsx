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
      await refresh("dashboard-enable");
    }
  };

  if (!enabled || loading || diagnostics.permission === "unsupported") return null;

  let tone = {
    background: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.35)",
    icon: "#d97706"
  };
  let title = "";
  let body = diagnostics.statusReason || "";
  let primaryLabel = "";
  let primaryAction: (() => void | Promise<void>) | null = null;

  if (diagnostics.permission === "denied") {
    tone = {
      background: "rgba(239, 68, 68, 0.10)",
      border: "rgba(239, 68, 68, 0.28)",
      icon: "#dc2626"
    };
    title = "Notifications are blocked";
    primaryLabel = "Open Notifications";
    primaryAction = () => router.push("/mobile/notifications");
  } else if (diagnostics.permission !== "granted") {
    title = "Turn on notifications";
    primaryLabel = WebPushHelper.requiresInstallForPush() ? "Install App" : busy ? "Enabling..." : "Enable Notifications";
    primaryAction = busy ? null : handleEnable;
  } else if (!diagnostics.hasSubscription || (diagnostics.serverRegistrationEnabled && !diagnostics.hasConfirmedServerEnrollment)) {
    title = diagnostics.isStandalone ? "Finish device registration" : "Install to finish notifications";
    primaryLabel = WebPushHelper.requiresInstallForPush() ? "Install App" : busy ? "Retrying..." : "Retry Registration";
    primaryAction = busy ? null : handleEnable;
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
      <Icon sx={{ color: tone.icon, fontSize: 22, mt: "2px" }}>notifications_active</Icon>
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
          <Button size="small" variant="text" onClick={() => router.push("/mobile/install")}>
            Install Help
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
