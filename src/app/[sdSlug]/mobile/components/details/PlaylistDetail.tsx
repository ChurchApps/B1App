"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Icon, Skeleton, Typography } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { formatDate, shadePrimary } from "../util";
import { SermonCard } from "../SermonCard";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

export const PlaylistDetail = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const churchId = config?.church?.id;

  const {
    data: playlistData,
    isLoading: playlistLoading,
    error: playlistError,
    refetch: refetchPlaylist
  } = useQuery<PlaylistInterface | null>({
    queryKey: ["playlist", churchId, id],
    queryFn: async () => {
      // `/playlists/:id` is authenticated, so anonymous mobile visitors must
      // look the playlist up in the public list for their church.
      const list = await ApiHelper.getAnonymous(`/playlists/public/${churchId}`, "ContentApi");
      if (!Array.isArray(list)) return null;
      const match = list.find((p: any) => p && p.id === id) as PlaylistInterface | undefined;
      return match ?? null;
    },
    enabled: !!churchId && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const {
    data: sermons = null,
    error: sermonsError,
    refetch: refetchSermons
  } = useQuery<SermonInterface[]>({
    queryKey: ["playlist-sermons", churchId, id],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous(`/sermons/public/${churchId}`, "ContentApi");
      if (!Array.isArray(data)) return [];
      return data
        .filter((s: any) => s && s.id && s.title && s.playlistId === id)
        .sort((a: any, b: any) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime()) as SermonInterface[];
    },
    enabled: !!churchId && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const hasError = !!playlistError || !!sermonsError;

  // Preserve the undefined/null/value tri-state the render logic depends on.
  // While the config hasn't provided a churchId yet, the query is disabled and
  // `playlistData` is undefined — treat that as loading, not "not found".
  const playlist: PlaylistInterface | null | undefined =
    playlistLoading || !churchId ? undefined : (playlistData ?? null);

  const handleRetry = () => {
    if (playlistError) refetchPlaylist();
    if (sermonsError) refetchSermons();
  };

  const heroGradient = `linear-gradient(135deg, ${shadePrimary(tc.primary, -12)} 0%, ${shadePrimary(tc.primary, 18)} 55%, ${shadePrimary(tc.primary, 28)} 100%)`;

  const renderHero = () => {
    const hasImage = !!playlist?.thumbnail && playlist.thumbnail.trim() !== "";
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          borderRadius: `${mobileTheme.radius.xl}px`,
          overflow: "hidden",
          boxShadow: mobileTheme.shadows.md,
          background: hasImage ? undefined : heroGradient
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
        {!hasImage && (
          <>
            <Box sx={{
              position: "absolute",
              width: 150,
              height: 150,
              borderRadius: "75px",
              bgcolor: "rgba(255,255,255,0.1)",
              top: -30,
              right: -30
            }} />
            <Box sx={{
              position: "absolute",
              width: 100,
              height: 100,
              borderRadius: "50px",
              bgcolor: "rgba(255,255,255,0.08)",
              bottom: -25,
              left: -25
            }} />
            <Box sx={{
              position: "absolute",
              width: 80,
              height: 80,
              borderRadius: "40px",
              bgcolor: "rgba(255,255,255,0.12)",
              top: "40%",
              left: "30%"
            }} />
          </>
        )}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: `${mobileTheme.spacing.md}px`,
            textAlign: "center"
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
              mb: "6px"
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
                • {sermons.length} sermon{sermons.length !== 1 ? "s" : ""}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderSkeleton = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
      <Skeleton
        variant="rounded"
        sx={{ width: "100%", paddingTop: "56.25%", borderRadius: `${mobileTheme.radius.xl}px` }}
      />
      {[0, 1, 2].map((i) => (
        <Skeleton
          key={`sk-${i}`}
          variant="rounded"
          sx={{ width: "100%", paddingTop: "56.25%", borderRadius: `${mobileTheme.radius.xl}px` }}
        />
      ))}
    </Box>
  );

  const renderError = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
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
          mb: `${mobileTheme.spacing.md}px`
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.error }}>error_outline</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
        Unable to Load Playlist
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.md}px` }}>
        Please check your connection and try again.
      </Typography>
      <Button
        variant="contained"
        onClick={handleRetry}
        sx={{
          bgcolor: tc.primary,
          color: tc.onPrimary,
          textTransform: "none",
          fontWeight: 500,
          borderRadius: `${mobileTheme.radius.md}px`,
          "&:hover": { bgcolor: tc.primary }
        }}
      >
        Retry
      </Button>
    </Box>
  );

  const renderNotFound = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
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
          mb: `${mobileTheme.spacing.md}px`
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
          borderRadius: `${mobileTheme.radius.md}px`
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
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
      }}
    >
      <Icon sx={{ fontSize: 48, color: tc.textSecondary, mb: 2 }}>video_library</Icon>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 0.5 }}>
        No Sermons in This Series
      </Typography>
      <Typography sx={{ fontSize: 13, color: tc.textMuted }}>
        Sermons will appear here as they are added to this series.
      </Typography>
    </Box>
  );

  const handleSermonClick = (sermon: SermonInterface) => {
    if (!sermon.id) return;
    router.push(`/mobile/sermons/${sermon.id}`);
  };

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {hasError && renderError()}
      {!hasError && playlist === undefined && renderSkeleton()}
      {!hasError && playlist === null && renderNotFound()}
      {!hasError && playlist && (
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
              {[0, 1].map((i) => (
                <Skeleton
                  key={`s-${i}`}
                  variant="rounded"
                  sx={{ width: "100%", paddingTop: "56.25%", borderRadius: `${mobileTheme.radius.xl}px` }}
                />
              ))}
            </Box>
          )}
          {sermons && sermons.length === 0 && renderEmptySermons()}
          {sermons && sermons.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
              {sermons.map((s) => (
                <SermonCard key={s.id} sermon={s} onClick={() => handleSermonClick(s)} />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PlaylistDetail;
