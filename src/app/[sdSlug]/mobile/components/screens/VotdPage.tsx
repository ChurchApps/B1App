"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Icon, Typography } from "@mui/material";
import { mobileTheme } from "../mobileTheme";

const getDayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

const getShape = () => {
  if (typeof window === "undefined") return "16x9";
  const ratio = window.innerWidth / window.innerHeight;
  const diff1x1 = Math.abs(ratio - 1);
  const diff16x9 = Math.abs(ratio - 1.777);
  const diff9x16 = Math.abs(ratio - 0.5625);
  if (diff16x9 < diff1x1) return "16x9";
  if (diff9x16 < diff1x1) return "9x16";
  return "1x1";
};

export const VotdPage = () => {
  const tc = mobileTheme.colors;
  const [isClient, setIsClient] = useState(false);
  const [shape, setShape] = useState("9x16");
  const [day, setDay] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    setDay(getDayOfYear());
    const onResize = () => setShape(getShape());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const imageUrl = useMemo(() => {
    if (day === null) return "";
    return `https://votd.org/v1/${day}/${shape}.jpg`;
  }, [day, shape]);

  const handleShare = async () => {
    const shareData = {
      title: "Verse of the Day",
      text: "Check out today's Verse of the Day",
      url: imageUrl || window.location.href
    };
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share(shareData);
        return;
      }
    } catch {

    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        setShareMessage("Link copied to clipboard");
        setTimeout(() => setShareMessage(null), 2500);
      }
    } catch {
      setShareMessage("Unable to share");
      setTimeout(() => setShareMessage(null), 2500);
    }
  };

  return (
    <Box sx={{ bgcolor: tc.surface, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{
        position: "relative",
        flex: 1,
        minHeight: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {isClient && imageUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <CircularProgress
                size={32}
                sx={{ position: "absolute", top: "50%", left: "50%", mt: "-16px", ml: "-16px", color: tc.text }}
              />
            )}
            { }
            <img
              src={imageUrl}
              alt="Verse of the Day"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              style={{

                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "fill"
              }}
            />
          </>
        ) : imageError ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography sx={{ color: tc.text, fontSize: 16, fontWeight: 600, mb: 1 }}>
              Unable to load today&apos;s verse
            </Typography>
            <Typography sx={{ color: tc.textMuted, fontSize: 14 }}>
              Please check your connection and try again.
            </Typography>
          </Box>
        ) : null}
      </Box>

      <Box sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        px: `${mobileTheme.spacing.md}px`,
        py: `${mobileTheme.spacing.sm}px`,
        gap: 1
      }}>
        {shareMessage && (
          <Typography sx={{ fontSize: 12, color: tc.textMuted }}>
            {shareMessage}
          </Typography>
        )}
        <Box
          role="button"
          tabIndex={0}
          onClick={handleShare}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleShare(); }}
          aria-label="Share Verse of the Day"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: "14px",
            py: "8px",
            borderRadius: `${mobileTheme.radius.lg}px`,
            bgcolor: tc.primary,
            color: tc.onPrimary,
            cursor: "pointer",
            transition: "opacity 150ms ease",
            "&:hover": { opacity: 0.9 }
          }}
        >
          <Icon sx={{ fontSize: 18, color: tc.onPrimary }}>share</Icon>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.onPrimary }}>
            Share
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
