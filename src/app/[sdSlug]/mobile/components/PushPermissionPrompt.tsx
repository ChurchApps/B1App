"use client";

import React, { useContext, useEffect, useState } from "react";
import { Box, Button, IconButton, Icon, Typography } from "@mui/material";
import { Locale, UserHelper } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { WebPushHelper } from "@/helpers";
import { mobileTheme } from "./mobileTheme";

export const PushPermissionPrompt = () => {
  const context = useContext(UserContext);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!UserHelper.user?.id || !context.userChurch?.jwt) return;
      if (!WebPushHelper.isSupported()) return;
      if (!WebPushHelper.isStandalone()) return;
      if (!WebPushHelper.canPromptNow()) return;
      const existing = await WebPushHelper.getExistingSubscription();
      if (existing) return;
      if (!cancelled) setVisible(true);
    };
    const t = setTimeout(check, 4000);
    return () => { cancelled = true; clearTimeout(t); };
  }, [context.userChurch?.jwt]);

  const handleEnable = async () => {
    setBusy(true);
    try { await WebPushHelper.subscribe(); }
    finally {
      setBusy(false);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    WebPushHelper.markPrompted();
    setVisible(false);
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
