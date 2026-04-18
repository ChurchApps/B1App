"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Icon, Typography } from "@mui/material";
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
  if (diff16x9 < diff1x1 && diff16x9 < diff9x16) return "16x9";
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
      url: imageUrl || window.location.href,
    };
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share(shareData);
        return;
      }
    } catch {
      // user dismissed or error; fall through to clipboard
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
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{
        position: "relative",
        borderRadius: `${mobileTheme.radius.xl}px`,
        overflow: "hidden",
        boxShadow: mobileTheme.shadows.lg,
        background: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
        color: "#FFFFFF",
        minHeight: 360,
        display: "flex",
        flexDirection: "column",
      }}>
        <Box sx={{
          p: `${mobileTheme.spacing.md}px`,
          pb: `${mobileTheme.spacing.sm}px`,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}>
          <Icon sx={{ fontSize: 24, color: "#FFFFFF" }}>auto_stories</Icon>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", opacity: 0.95 }}>
            Verse of the Day
          </Typography>
        </Box>

        <Box sx={{
          position: "relative",
          flex: 1,
          minHeight: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(0,0,0,0.1)",
        }}>
          {isClient && imageUrl && !imageError ? (
            <>
              {!imageLoaded && (
                <Typography sx={{ color: "#FFFFFF", opacity: 0.85, fontSize: 14, position: "absolute" }}>
                  Loading today's verse...
                </Typography>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Verse of the Day"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  opacity: imageLoaded ? 1 : 0,
                  transition: "opacity 300ms ease",
                }}
              />
            </>
          ) : imageError ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography sx={{ color: "#FFFFFF", fontSize: 16, fontWeight: 600, mb: 1 }}>
                Unable to load today's verse
              </Typography>
              <Typography sx={{ color: "#FFFFFF", opacity: 0.85, fontSize: 14 }}>
                Please check your connection and try again.
              </Typography>
            </Box>
          ) : null}
        </Box>

        <Box sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: `${mobileTheme.spacing.md}px`,
          borderTop: "1px solid rgba(255,255,255,0.15)",
        }}>
          <Typography sx={{ fontSize: 12, color: "#FFFFFF", opacity: 0.85 }}>
            {shareMessage || "Encouragement for today"}
          </Typography>
          <Box
            role="button"
            tabIndex={0}
            onClick={handleShare}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleShare(); }}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: "14px",
              py: "8px",
              borderRadius: `${mobileTheme.radius.lg}px`,
              bgcolor: "rgba(255,255,255,0.2)",
              cursor: "pointer",
              transition: "background-color 150ms ease",
              "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
            }}
          >
            <Icon sx={{ fontSize: 18, color: "#FFFFFF" }}>share</Icon>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>
              Share
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
