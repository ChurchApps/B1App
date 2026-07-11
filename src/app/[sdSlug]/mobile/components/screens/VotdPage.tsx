"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Icon, Typography } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { mobileTheme } from "../mobileTheme";
import { loadDailyVerse, type DailyVerse } from "../../helpers/dailyVerses";

const getDayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const getShape = () => {
  if (typeof window === "undefined") return "9x16";
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
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [shape, setShape] = useState("9x16");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    setDay(getDayOfYear());
    const onResize = () => setShape(getShape());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadDailyVerse().then((v) => { if (!cancelled) setVerse(v); });
    return () => { cancelled = true; };
  }, []);

  const imageUrl = useMemo(() => (day === null ? "" : `https://votd.org/v1/${day}/${shape}.jpg`), [day, shape]);
  const showImage = !!imageUrl && !imageError;

  const handleShare = async () => {
    const shareText = verse ? `"${verse.text}" — ${verse.reference}` : "Verse of the Day";
    const shareData = {
      title: "Verse of the Day",
      text: shareText,
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
        await navigator.clipboard.writeText(`${shareText}\n${shareData.url}`);
        setShareMessage("Copied to clipboard");
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
        minHeight: "calc(100vh - 140px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: `${mobileTheme.spacing.lg}px`,
        background: mobileTheme.verseGradient,
        overflow: "hidden"
      }}>
        {/* Typeset verse doubles as the loading state and the offline/error fallback. */}
        {verse && (!showImage || !imageLoaded) && (
          <>
            <Typography sx={{
              fontFamily: mobileTheme.fonts.serif,
              fontStyle: "italic",
              fontSize: 26,
              lineHeight: 1.5,
              color: "#FFFFFF",
              maxWidth: 320,
              mb: "14px"
            }}>
              {verse.text}
            </Typography>
            <Typography sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.75)"
            }}>
              {verse.reference}
            </Typography>
          </>
        )}
        {showImage && (
          <img
            src={imageUrl}
            alt={verse ? `${verse.reference} — Verse of the Day` : "Verse of the Day"}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 300ms ease"
            }}
          />
        )}
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
          aria-label={Locale.label("mobile.screens.shareVotd")}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: "14px",
            py: "8px",
            borderRadius: "999px",
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
