"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Icon, IconButton, Typography } from "@mui/material";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

export const WebsiteUrlPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const params = useSearchParams();
  const url = params?.get("url") || "";
  const title = params?.get("title") || "Website";

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/mobile/dashboard");
  };

  if (!url) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.xl}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
          }}
        >
          <Icon sx={{ fontSize: 32, color: tc.primary, mb: 1 }}>link_off</Icon>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text }}>No URL provided</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        bgcolor: tc.background,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${mobileTheme.spacing.sm}px`,
          px: `${mobileTheme.spacing.md}px`,
          py: `${mobileTheme.spacing.sm}px`,
          bgcolor: tc.surface,
          borderBottom: `1px solid ${tc.border}`,
        }}
      >
        <IconButton aria-label="Back" onClick={handleBack} sx={{ color: tc.text }}>
          <Icon>arrow_back</Icon>
        </IconButton>
        <Typography
          sx={{
            flex: 1,
            fontSize: 16,
            fontWeight: 600,
            color: tc.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>
        <IconButton
          aria-label="Open in new tab"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          sx={{ color: tc.text }}
        >
          <Icon>open_in_new</Icon>
        </IconButton>
      </Box>
      <Box
        component="iframe"
        src={url}
        title={title}
        sx={{
          flex: 1,
          width: "100%",
          border: 0,
          bgcolor: tc.surface,
        }}
      />
    </Box>
  );
};

export default WebsiteUrlPage;
