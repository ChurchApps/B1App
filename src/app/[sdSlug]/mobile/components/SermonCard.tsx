"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import type { SermonInterface } from "@churchapps/helpers";
import { mobileTheme } from "./mobileTheme";
import { formatDate, formatDuration } from "./util";

interface Props {
  sermon: SermonInterface;
  onClick: () => void;
}

export const SermonCard = ({ sermon, onClick }: Props) => {
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
        cursor: "pointer",
        background: hasImage ? `url(${sermon.thumbnail}) center / cover no-repeat, ${mobileTheme.colorWash}` : mobileTheme.colorWash,
        "&:active": { transform: "scale(0.985)" },
        transition: "transform 120ms ease"
      }}
    >
      {sermon.duration ? (
        <Box sx={{
          position: "absolute",
          top: 12,
          right: 12,
          bgcolor: "rgba(0,0,0,0.6)",
          borderRadius: "999px",
          px: "10px",
          py: "5px"
        }}>
          <Typography sx={{ color: "#FFFFFF", fontSize: 10.5, fontWeight: 700 }}>
            {formatDuration(sermon.duration)}
          </Typography>
        </Box>
      ) : null}

      <Box sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(transparent, rgba(7,14,27,0.78))",
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
