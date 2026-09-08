"use client";

import React from "react";
import Link from "next/link";
import { Box, Button, Icon, Typography } from "@mui/material";
import { mobileTheme } from "./mobileTheme";

interface Props {
  title: string;
  icon?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export const PlaceholderPage = ({ title, icon = "construction", description, actionLabel, actionHref }: Props) => {
  const tc = mobileTheme.colors;
  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, minHeight: "100%", bgcolor: tc.background }}>
      <Box sx={{
        bgcolor: tc.surface,
        border: `1px solid ${tc.border}`,
        borderRadius: `${mobileTheme.radius.xl}px`,
        p: 4,
        textAlign: "center"
      }}>
        <Box sx={{
          width: 72,
          height: 72,
          borderRadius: "20px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2
        }}>
          <Icon sx={{ fontSize: 36, color: tc.primary }}>{icon}</Icon>
        </Box>
        <Typography sx={{ fontSize: 20, fontWeight: 600, color: tc.text, mb: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
          {description}
        </Typography>
        {actionLabel && actionHref && (
          <Button
            component={Link}
            href={actionHref}
            variant="outlined"
            sx={{ mt: 2, borderColor: tc.primary, color: tc.primary, textTransform: "none", borderRadius: `${mobileTheme.radius.md}px` }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
};
