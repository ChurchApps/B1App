"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Chip, CircularProgress, Icon, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import { ApiHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatDate = (date?: Date | string) => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

/**
 * Build an embeddable iframe src URL from the sermon's video fields.
 * Mirrors B1Mobile's sermonDetails screen.
 */
const buildEmbedUrl = (sermon: SermonInterface | null): string | null => {
  if (!sermon) return null;
  const videoType = (sermon as any).videoType as string | undefined;
  const videoData = (sermon as any).videoData as string | undefined;
  const videoUrl = (sermon as any).videoUrl as string | undefined;

  if (videoType && videoData) {
    switch (videoType) {
      case "youtube":
        return `https://www.youtube.com/embed/${videoData}?rel=0&modestbranding=1`;
      case "youtube_channel":
        return `https://www.youtube.com/embed/live_stream?channel=${videoData}`;
      case "vimeo":
        return `https://player.vimeo.com/video/${videoData}`;
      case "facebook":
        return `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo.php%3Fv%3D${videoData}&show_text=0&allowFullScreen=1`;
      default:
        return videoData;
    }
  }

  if (videoUrl) return videoUrl;
  return null;
};

export const SermonDetail = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const churchId = config?.church?.id;

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
    enabled: !!id,
  });

  const embedUrl = useMemo(() => buildEmbedUrl(sermon), [sermon]);

  const BackButton = (
    <IconButton
      onClick={() => router.push("/mobile/sermons")}
      aria-label="Back"
      sx={{
        color: tc.primary,
        bgcolor: tc.surface,
        width: 40,
        height: 40,
        boxShadow: mobileTheme.shadows.sm,
        "&:hover": { bgcolor: tc.surfaceVariant },
      }}
    >
      <ArrowBackIcon sx={{ fontSize: 24 }} />
    </IconButton>
  );

  if (loading) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box sx={{ mb: 2 }}>{BackButton}</Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <CircularProgress sx={{ color: tc.primary }} />
        </Box>
      </Box>
    );
  }

  if (!sermon) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box sx={{ mb: 2 }}>{BackButton}</Box>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
            mt: 4,
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

  const keywordList: string[] = (() => {
    const k = (sermon as any).keywords;
    if (!k) return [];
    if (Array.isArray(k)) return k.filter(Boolean);
    if (typeof k === "string") {
      return k
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  })();

  const playlistId = (sermon as any).playlistId as string | undefined;
  const description = (sermon as any).description as string | undefined;

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {/* Back button */}
      <Box sx={{ mb: `${mobileTheme.spacing.md}px` }}>{BackButton}</Box>

      {/* Video / placeholder */}
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
          backgroundImage: sermon.thumbnail && !embedUrl ? `url(${sermon.thumbnail})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
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
                : `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
            }}
          >
            <PlayCircleFilledIcon sx={{ fontSize: 72, color: "#FFFFFF", opacity: 0.9 }} />
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
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: tc.text, lineHeight: 1.25, mb: 1 }}>
          {sermon.title || "Untitled Sermon"}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {sermon.publishDate && (
            <Typography sx={{ fontSize: 14, fontWeight: 400, color: tc.textSecondary }}>
              {formatDate(sermon.publishDate)}
            </Typography>
          )}
          {sermon.duration ? (
            <Box
              sx={{
                px: "10px",
                py: "2px",
                borderRadius: "999px",
                bgcolor: tc.primaryLight,
                color: tc.primary,
                fontSize: 12,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Icon sx={{ fontSize: 14 }}>schedule</Icon>
              {formatDuration(sermon.duration)}
            </Box>
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
              whiteSpace: "pre-wrap",
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>

      {/* Chips */}
      {(playlistId || keywordList.length > 0) && (
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.md}px`,
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {playlistId ? (
            <Chip
              icon={<Icon sx={{ fontSize: 16 }}>playlist_play</Icon>}
              label="View Series"
              size="small"
              clickable
              onClick={() => router.push(`/mobile/playlist/${playlistId}`)}
              sx={{
                bgcolor: tc.primaryLight,
                color: tc.primary,
                fontWeight: 600,
                "& .MuiChip-icon": { color: tc.primary },
                cursor: "pointer",
              }}
            />
          ) : null}
          {keywordList.map((kw) => (
            <Chip
              key={kw}
              label={kw}
              size="small"
              sx={{ bgcolor: tc.iconBackground, color: tc.text, fontWeight: 500 }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SermonDetail;
