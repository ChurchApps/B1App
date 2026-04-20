"use client";

import React, { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Box, Button, CircularProgress, Icon, Snackbar, Typography } from "@mui/material";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShareIcon from "@mui/icons-material/Share";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { ApiHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { formatDate, formatDuration } from "../util";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

// Build an embeddable iframe src URL from the sermon's video fields.
const buildEmbedUrl = (sermon: SermonInterface | null): string | null => {
  if (!sermon) return null;
  const videoType = (sermon as any).videoType as string | undefined;
  const videoData = (sermon as any).videoData as string | undefined;
  const videoUrl = (sermon as any).videoUrl as string | undefined;

  if (videoType && videoData) {
    switch (videoType) {
      case "youtube": return `https://www.youtube.com/embed/${videoData}?autoplay=1&rel=0&modestbranding=1`;
      case "youtube_channel": return `https://www.youtube.com/embed/live_stream?channel=${videoData}&autoplay=1`;
      case "vimeo": return `https://player.vimeo.com/video/${videoData}?autoplay=1`;
      case "facebook": return `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo.php%3Fv%3D${videoData}&show_text=0&autoplay=1&allowFullScreen=1`;
      default: return videoData;
    }
  }

  if (videoUrl) return videoUrl;
  return null;
};

/**
 * Build a non-embed external URL suitable for opening on the provider's site.
 */
const buildExternalUrl = (sermon: SermonInterface | null): string | null => {
  if (!sermon) return null;
  const videoType = (sermon as any).videoType as string | undefined;
  const videoData = (sermon as any).videoData as string | undefined;
  const videoUrl = (sermon as any).videoUrl as string | undefined;

  if (videoType && videoData) {
    switch (videoType) {
      case "youtube": return `https://www.youtube.com/watch?v=${videoData}`;
      case "youtube_channel": return `https://www.youtube.com/channel/${videoData}/live`;
      case "vimeo": return `https://vimeo.com/${videoData}`;
      case "facebook": return `https://www.facebook.com/video.php?v=${videoData}`;
      default: return videoData;
    }
  }

  if (videoUrl) return videoUrl;
  return null;
};

export const SermonDetail = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
  const churchId = config?.church?.id;

  const [showVideo, setShowVideo] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const { data: sermon = null, isLoading: loading } = useQuery<SermonInterface | null>({
    queryKey: ["sermon", churchId, id],
    queryFn: async () => {
      let found: SermonInterface | null = null;
      if (churchId) {
        const list = await ApiHelper.getAnonymous(`/sermons/public/${churchId}`, "ContentApi");
        if (Array.isArray(list)) {
          found = list.find((s: any) => s && s.id === id) || null;
        }
      }
      if (!found) {
        try {
          const direct = await ApiHelper.getAnonymous(`/sermons/${id}`, "ContentApi");
          if (direct && direct.id) found = direct as SermonInterface;
        } catch {
          /* ignore */
        }
      }
      return found;
    },
    enabled: !!id
  });

  const playlistId = (sermon as any)?.playlistId as string | undefined;

  // Lazily resolve the playlist title when a sermon is in a series.
  const { data: playlistTitle } = useQuery<string | null>({
    queryKey: ["sermon-playlist-title", churchId, playlistId],
    queryFn: async () => {
      if (!churchId || !playlistId) return null;
      try {
        const list = await ApiHelper.getAnonymous(`/playlists/public/${churchId}`, "ContentApi");
        if (Array.isArray(list)) {
          const match = list.find((p: any) => p && p.id === playlistId) as PlaylistInterface | undefined;
          return match?.title || null;
        }
      } catch {
        /* ignore */
      }
      return null;
    },
    enabled: !!churchId && !!playlistId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const embedUrl = useMemo(() => buildEmbedUrl(sermon), [sermon]);
  const externalUrl = useMemo(() => buildExternalUrl(sermon), [sermon]);

  const handleShare = useCallback(async () => {
    if (!sermon) return;
    const shareUrl =
      externalUrl ||
      (typeof window !== "undefined" ? window.location.href : "");
    const title = sermon.title || "Sermon";
    const text = `Check out this sermon: "${title}" ${shareUrl}`.trim();

    try {
      if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
        await (navigator as any).share({ title, text, url: shareUrl });
        return;
      }
    } catch {
      /* fall through to clipboard */
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setSnackbar("Link copied to clipboard");
        return;
      }
    } catch {
      /* ignore */
    }
    setSnackbar("Unable to share on this device");
  }, [sermon, externalUrl]);

  const handleOpenExternal = useCallback(() => {
    if (!externalUrl || typeof window === "undefined") return;
    window.open(externalUrl, "_blank", "noopener,noreferrer");
  }, [externalUrl]);

  if (loading) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <CircularProgress sx={{ color: tc.primary }} />
        </Box>
      </Box>
    );
  }

  if (!sermon) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.xl}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
            mt: 4
          }}
        >
          <Icon sx={{ fontSize: 56, color: tc.textSecondary, mb: 1 }}>sentiment_dissatisfied</Icon>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
            Sermon not available
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
            This sermon may have been removed or is no longer public.
          </Typography>
          <Link href="/mobile/sermons" style={{ color: tc.primary, fontWeight: 600, textDecoration: "none" }}>
            Back to Sermons
          </Link>
        </Box>
      </Box>
    );
  }

  const description = (sermon as any).description as string | undefined;
  const canPlay = !!embedUrl;
  const showPlayer = showVideo && canPlay;

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {/* Video / thumbnail preview with tap-to-play gate */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          pt: "56.25%",
          borderRadius: `${mobileTheme.radius.xl}px`,
          overflow: "hidden",
          bgcolor: tc.primary,
          boxShadow: mobileTheme.shadows.md,
          mb: `${mobileTheme.spacing.md}px`,
          backgroundImage:
            sermon.thumbnail && !showPlayer ? `url(${sermon.thumbnail})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          cursor: !showPlayer && canPlay ? "pointer" : "default"
        }}
        onClick={() => {
          if (!showPlayer && canPlay) setShowVideo(true);
        }}
        role={!showPlayer && canPlay ? "button" : undefined}
        aria-label={!showPlayer && canPlay ? "Play sermon" : undefined}
        tabIndex={!showPlayer && canPlay ? 0 : undefined}
        onKeyDown={(e) => {
          if (!showPlayer && canPlay && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setShowVideo(true);
          }
        }}
      >
        {showPlayer ? (
          <iframe
            src={embedUrl!}
            title={sermon.title || "Sermon"}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: sermon.thumbnail
                ? "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 100%)"
                : `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`
            }}
          >
            <PlayCircleFilledIcon sx={{ fontSize: 80, color: "#FFFFFF", opacity: 0.95 }} />
            {sermon.duration ? (
              <Box
                sx={{
                  position: "absolute",
                  right: 12,
                  bottom: 12,
                  px: "8px",
                  py: "2px",
                  borderRadius: "6px",
                  bgcolor: "rgba(0,0,0,0.65)",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.4
                }}
              >
                {formatDuration(sermon.duration)}
              </Box>
            ) : null}
          </Box>
        )}
      </Box>

      {/* Title + meta */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          mb: `${mobileTheme.spacing.md}px`
        }}
      >
        {playlistTitle ? (
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: tc.primary,
              textTransform: "uppercase",
              letterSpacing: "1px",
              mb: 1
            }}
          >
            {playlistTitle}
          </Typography>
        ) : null}
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: tc.text, lineHeight: 1.25, mb: 1 }}>
          {sermon.title || "Untitled Sermon"}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {sermon.publishDate && (
            <Typography sx={{ fontSize: 14, fontWeight: 400, color: tc.textMuted }}>
              {formatDate(sermon.publishDate)}
            </Typography>
          )}
          {sermon.duration ? (
            <>
              <Typography sx={{ fontSize: 14, color: tc.textMuted }}>•</Typography>
              <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
                {formatDuration(sermon.duration)}
              </Typography>
            </>
          ) : null}
        </Box>

        {/* Description */}
        {description ? (
          <Typography
            sx={{
              mt: `${mobileTheme.spacing.md}px`,
              fontSize: 15,
              fontWeight: 400,
              color: tc.text,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap"
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>

      {/* Action buttons */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: `${mobileTheme.spacing.sm}px`,
          mb: `${mobileTheme.spacing.md}px`
        }}
      >
        <Box sx={{ display: "flex", gap: `${mobileTheme.spacing.sm}px` }}>
          <Button
            variant="outlined"
            onClick={handleShare}
            startIcon={<ShareIcon />}
            sx={{
              flex: 1,
              borderColor: tc.primary,
              color: tc.primary,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: `${mobileTheme.radius.md}px`,
              "&:hover": { borderColor: tc.primary, bgcolor: tc.primaryLight }
            }}
          >
            Share
          </Button>
          <Button
            variant="outlined"
            onClick={handleOpenExternal}
            disabled={!externalUrl}
            startIcon={<OpenInNewIcon />}
            sx={{
              flex: 1,
              borderColor: tc.primary,
              color: tc.primary,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: `${mobileTheme.radius.md}px`,
              "&:hover": { borderColor: tc.primary, bgcolor: tc.primaryLight }
            }}
          >
            Open Link
          </Button>
        </Box>

        {canPlay && !showPlayer && (
          <Button
            variant="contained"
            onClick={() => setShowVideo(true)}
            startIcon={<PlayArrowIcon />}
            sx={{
              bgcolor: tc.primary,
              color: tc.onPrimary,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: `${mobileTheme.radius.lg}px`,
              py: 1.25,
              boxShadow: mobileTheme.shadows.md,
              "&:hover": { bgcolor: tc.primary, boxShadow: mobileTheme.shadows.lg }
            }}
          >
            Watch Sermon
          </Button>
        )}
      </Box>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar || ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default SermonDetail;
