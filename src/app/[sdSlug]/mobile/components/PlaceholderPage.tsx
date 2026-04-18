"use client";

import React from "react";
import { Box, Icon, Typography } from "@mui/material";
import { mobileTheme } from "./mobileTheme";

interface Props {
  title: string;
  icon?: string;
  description?: string;
}

export const PlaceholderPage = ({ title, icon = "construction", description }: Props) => {
  const tc = mobileTheme.colors;
  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, minHeight: "100%", bgcolor: tc.background }}>
      <Box sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        p: 4,
        textAlign: "center",
        boxShadow: mobileTheme.shadows.md,
      }}>
        <Box sx={{
          width: 72,
          height: 72,
          borderRadius: "36px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}>
          <Icon sx={{ fontSize: 36, color: tc.primary }}>{icon}</Icon>
        </Box>
        <Typography sx={{ fontSize: 20, fontWeight: 600, color: tc.text, mb: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
          {description || "Coming soon to the mobile PWA."}
        </Typography>
      </Box>
    </Box>
  );
};
