"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Icon, IconButton, Skeleton, Typography } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

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

export const PlaylistDetail = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const churchId = config?.church?.id;

  const { data: playlistData, isLoading: playlistLoading } = useQuery<PlaylistInterface | null>({
    queryKey: ["playlist", id],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous(`/playlists/${id}`, "ContentApi");
      return data && data.id ? (data as PlaylistInterface) : null;
    },
    enabled: !!id,
  });

  const { data: sermons = null } = useQuery<SermonInterface[]>({
    queryKey: ["playlist-sermons", churchId, id],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous(`/sermons/public/${churchId}`, "ContentApi");
      if (!Array.isArray(data)) return [];
      return data
        .filter((s: any) => s && s.id && s.title && s.playlistId === id)
        .sort((a: any, b: any) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime()) as SermonInterface[];
    },
    enabled: !!churchId && !!id,
  });

  // Preserve the undefined/null/value tri-state the render logic depends on.
  const playlist: PlaylistInterface | null | undefined = playlistLoading ? undefined : (playlistData ?? null);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/mobile/sermons");
  };

  const renderBack = () => (
    <IconButton
      aria-label="Back"
      onClick={handleBack}
      sx={{
        width: 40,
        height: 40,
        bgcolor: tc.surface,
        color: tc.text,
        boxShadow: mobileTheme.shadows.sm,
        mb: `${mobileTheme.spacing.md}px`,
        "&:hover": { bgcolor: tc.surface },
      }}
    >
      <Icon>arrow_back</Icon>
    </IconButton>
  );

  const renderHero = () => {
    const hasImage = !!playlist?.thumbnail && playlist.thumbnail.trim() !== "";
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          borderRadius: `${mobileTheme.radius.lg}px`,
          overflow: "hidden",
          boxShadow: mobileTheme.shadows.md,
          background: hasImage
            ? undefined
            : `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
        }}
      >
        {hasImage && (
          <Box
            component="img"
            src={playlist!.thumbnail!}
            alt={playlist?.title || "Playlist"}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: hasImage ? "rgba(0,0,0,0.5)" : "transparent",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: `${mobileTheme.spacing.md}px`,
            textAlign: "center",
          }}
        >
          {!hasImage && <Icon sx={{ fontSize: 48, color: "#FFFFFF", opacity: 0.9, mb: 1 }}>playlist_play</Icon>}
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "#FFFFFF",
              opacity: 0.9,
              letterSpacing: 1,
              textTransform: "uppercase",
              mb: "6px",
            }}
          >
            Sermon Series
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>
            {playlist?.title || "Untitled Series"}
          </Typography>
          {playlist?.description ? (
            <Typography
              sx={{ fontSize: 13, color: "rgba(255,255,255,0.9)", mt: "8px", maxWidth: 420 }}
            >
              {playlist.description}
            </Typography>
          ) : null}
          <Box sx={{ display: "flex", gap: 1, mt: "10px" }}>
            {playlist?.publishDate && (
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                {formatDate(playlist.publishDate)}
              </Typography>
            )}
            {sermons && sermons.length > 0 && (
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                · {sermons.length} sermon{sermons.length !== 1 ? "s" : ""}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderSermon = (sermon: SermonInterface) => (
    <Box
      key={sermon.id}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/mobile/sermons/${sermon.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/mobile/sermons/${sermon.id}`);
        }
      }}
      sx={{
        display: "flex",
        gap: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.sm}px`,
        cursor: "pointer",
        transition: "box-shadow 150ms ease, transform 150ms ease",
        "&:hover": { boxShadow: mobileTheme.shadows.md },
        "&:active": { transform: "scale(0.995)" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: 112,
          aspectRatio: "16 / 9",
          flexShrink: 0,
          borderRadius: `${mobileTheme.radius.md}px`,
          overflow: "hidden",
          bgcolor: tc.primaryLight,
        }}
      >
        {sermon.thumbnail ? (
          <Box
            component="img"
            src={sermon.thumbnail}
            alt={sermon.title || "Sermon"}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tc.primary,
            }}
          >
            <Icon sx={{ fontSize: 32 }}>play_circle_outline</Icon>
          </Box>
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            color: tc.text,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {sermon.title || "Untitled"}
        </Typography>
        {sermon.publishDate && (
          <Typography sx={{ fontSize: 12, color: tc.textSecondary, mt: "4px" }}>
            {formatDate(sermon.publishDate)}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderSkeleton = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
      <Skeleton
        variant="rounded"
        sx={{ width: "100%", paddingTop: "56.25%", borderRadius: `${mobileTheme.radius.lg}px` }}
      />
      {[0, 1, 2].map((i) => (
        <Box
          key={`sk-${i}`}
          sx={{
            display: "flex",
            gap: `${mobileTheme.spacing.md}px`,
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            p: `${mobileTheme.spacing.sm}px`,
          }}
        >
          <Skeleton variant="rectangular" sx={{ width: 112, height: 63, borderRadius: `${mobileTheme.radius.md}px` }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={18} />
            <Skeleton variant="text" width="40%" height={14} />
          </Box>
        </Box>
      ))}
    </Box>
  );

  const renderNotFound = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "32px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.primary }}>playlist_remove</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
        Playlist Not Found
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.md}px` }}>
        This playlist could not be found.
      </Typography>
      <Button
        variant="outlined"
        onClick={() => router.push("/mobile/sermons")}
        sx={{
          borderColor: tc.primary,
          color: tc.primary,
          textTransform: "none",
          fontWeight: 500,
          borderRadius: `${mobileTheme.radius.md}px`,
        }}
      >
        Back to Sermons
      </Button>
    </Box>
  );

  const renderEmptySermons = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center",
      }}
    >
      <Icon sx={{ fontSize: 40, color: tc.textSecondary, mb: 1 }}>video_library</Icon>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 0.5 }}>
        No Sermons in This Series
      </Typography>
      <Typography sx={{ fontSize: 13, color: tc.textMuted }}>
        Sermons will appear here as they are added to this series.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {renderBack()}
      {playlist === undefined && renderSkeleton()}
      {playlist === null && renderNotFound()}
      {playlist && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
          {renderHero()}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text }}>Sermons</Typography>
            {sermons && sermons.length > 0 && (
              <Typography sx={{ fontSize: 13, color: tc.textSecondary }}>
                {sermons.length} sermon{sermons.length !== 1 ? "s" : ""}
              </Typography>
            )}
          </Box>
          {sermons === null && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
              {[0, 1].map((i) => (
                <Skeleton
                  key={`s-${i}`}
                  variant="rounded"
                  sx={{ height: 80, borderRadius: `${mobileTheme.radius.lg}px` }}
                />
              ))}
            </Box>
          )}
          {sermons && sermons.length === 0 && renderEmptySermons()}
          {sermons && sermons.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
              {sermons.map(renderSermon)}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PlaylistDetail;
