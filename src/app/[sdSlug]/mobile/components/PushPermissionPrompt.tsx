"use client";

import React, { useContext, useEffect, useState } from "react";
import { Box, Button, IconButton, Icon, Typography } from "@mui/material";
import { Locale, UserHelper } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { WebPushHelper } from "@/helpers";
import { mobileTheme } from "./mobileTheme";
import { useNotificationDiagnostics } from "../hooks/useNotificationDiagnostics";

export const PushPermissionPrompt = () => {
  const context = useContext(UserContext);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const loggedIn = !!UserHelper.user?.id && !!context.userChurch?.jwt;
  const { diagnostics, refresh } = useNotificationDiagnostics(loggedIn);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      if (!loggedIn) return setVisible(false);
      const shouldShow = diagnostics.permission === "default"
        && diagnostics.canPromptNow
        && !(WebPushHelper.requiresInstallForPush?.() || false)
        && !diagnostics.hasSubscription;
      if (!cancelled) setVisible(shouldShow);
    };
    const t = setTimeout(check, 2500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [diagnostics.canPromptNow, diagnostics.hasSubscription, diagnostics.permission, loggedIn]);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const subscription = await WebPushHelper.subscribe();
      if (!subscription && WebPushHelper.getPermissionState() === "granted") {
        throw new Error("Permission granted, but push registration did not complete.");
      }
      setVisible(false);
    } catch (error) {
      console.error("[webpush] prompt enable failed:", error);
    } finally {
      setBusy(false);
      await refresh("permission-prompt-enable");
    }
  };

  const handleDismiss = () => {
    WebPushHelper.markPrompted();
    setVisible(false);
    void refresh("permission-prompt-dismiss");
  };

  if (!visible) return null;

  const tc = mobileTheme.colors;

  return (
    <Box
      sx={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 1400,
        bgcolor: tc.surface,
        borderRadius: "12px",
        boxShadow: mobileTheme.shadows.md,
        p: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}
    >
      <Icon sx={{ color: tc.primary, fontSize: 28 }}>notifications_active</Icon>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text }}>
          {Locale.label("mobile.components.stayInLoop")}
        </Typography>
        <Typography sx={{ fontSize: 13, color: tc.textMuted, mt: "2px" }}>
          {Locale.label("mobile.components.stayInLoopDescription")}
        </Typography>
      </Box>
      <Button size="small" variant="contained" disabled={busy} onClick={handleEnable}>
        {Locale.label("mobile.components.turnOn")}
      </Button>
      <IconButton size="small" onClick={handleDismiss} aria-label={Locale.label("mobile.components.dismiss")}>
        <Icon fontSize="small">close</Icon>
      </IconButton>
    </Box>
  );
};
