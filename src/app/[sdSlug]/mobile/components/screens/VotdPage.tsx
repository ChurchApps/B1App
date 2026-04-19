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

/**
 * Shape picker matches B1Mobile's rule exactly (`app/(drawer)/votd.tsx`):
 * pick `16x9` whenever it beats `1x1`, else `9x16` when it beats `1x1`,
 * else fall back to `1x1`. Previously this required `diff16x9` to also
 * beat `diff9x16`, which could disagree with native on near-square viewports.
 */
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

  // Web-only enrichment beyond B1Mobile (which has no share affordance).
  // Kept intentionally — see `.notes/parity/votd.md`.
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
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Screen-level header — matches SermonsPage/GroupsPage pattern.
          B1Mobile gets this from `MainHeader`; web gets the global chrome from
          `MobileAppBar`, so the in-screen title lives here. */}
      <Box sx={{ px: `${mobileTheme.spacing.md}px`, pt: `${mobileTheme.spacing.md}px` }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
          Verse of the Day
        </Typography>
      </Box>

      {/* Edge-to-edge image area — matches B1Mobile `globalStyles.webViewContainer`
          under MainHeader. No gradient card, no icon header. */}
      <Box sx={{
        position: "relative",
        flex: 1,
        minHeight: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: tc.surface,
      }}>
        {isClient && imageUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <CircularProgress
                size={32}
                sx={{ position: "absolute", top: "50%", left: "50%", mt: "-16px", ml: "-16px", color: tc.text }}
              />
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

      {/* Share pill — web-only additive feature (Web Share API + clipboard
          fallback). B1Mobile has no share action; keeping this on web. */}
      <Box sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        px: `${mobileTheme.spacing.md}px`,
        py: `${mobileTheme.spacing.sm}px`,
        gap: 1,
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
            "&:hover": { opacity: 0.9 },
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
