"use client";

import React from "react";
import { Box, Icon, Typography } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import type { SermonInterface } from "@churchapps/helpers";
import { mobileTheme } from "./mobileTheme";
import { formatDate, formatDuration } from "./util";

interface Props {
  sermon: SermonInterface;
  onClick: () => void;
}

export const SermonCard = ({ sermon, onClick }: Props) => {
  const tc = mobileTheme.colors;
  const hasImage = !!(sermon.thumbnail && sermon.thumbnail.trim() !== "");

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      sx={{
        position: "relative",
        width: "100%",
        paddingTop: "56.25%",
        mb: `${mobileTheme.spacing.md - 4}px`,
        borderRadius: `${mobileTheme.radius.xl}px`,
        overflow: "hidden",
        boxShadow: mobileTheme.shadows.md,
        cursor: "pointer",
        bgcolor: tc.primary,
        backgroundImage: hasImage ? `url(${sermon.thumbnail})` : `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "box-shadow 200ms ease",
        "&:hover": { boxShadow: mobileTheme.shadows.lg }
      }}
    >
      {!hasImage && (
        <Box sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.9
        }}>
          <Icon sx={{ fontSize: 56, color: "#FFFFFF" }}>play_circle_outline</Icon>
        </Box>
      )}

      <Box sx={{
        position: "absolute",
        top: 12,
        right: 12,
        bgcolor: "rgba(0,0,0,0.7)",
        borderRadius: "20px",
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Icon sx={{ fontSize: 24, color: "#FFFFFF" }}>play_circle_filled</Icon>
      </Box>

      {sermon.duration ? (
        <Box sx={{
          position: "absolute",
          top: 12,
          left: 12,
          bgcolor: "rgba(0,0,0,0.8)",
          borderRadius: `${mobileTheme.radius.sm + 4}px`,
          px: "8px",
          py: "4px"
        }}>
          <Typography sx={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600 }}>
            {formatDuration(sermon.duration)}
          </Typography>
        </Box>
      ) : null}

      <Box sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 100%)",
        p: "16px",
        pt: "32px"
      }}>
        <Typography sx={{
          color: "#FFFFFF",
          fontWeight: 600,
          fontSize: 16,
          mb: 0.5,
          lineHeight: 1.2,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textShadow: "0 1px 2px rgba(0,0,0,0.4)"
        }}>
          {sermon.title || Locale.label("mobile.components.untitledSermon")}
        </Typography>
        <Typography sx={{ color: "#FFFFFF", opacity: 0.9, fontSize: 12, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
          {formatDate(sermon.publishDate, "short")}
        </Typography>
      </Box>
    </Box>
  );
};
