"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Icon, Skeleton, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { formatDate } from "../util";
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

  const playlist: PlaylistInterface | null | undefined =
    playlistLoading || !churchId ? undefined : (playlistData ?? null);

  const handleRetry = () => {
    if (playlistError) refetchPlaylist();
    if (sermonsError) refetchSermons();
  };

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
          background: hasImage
            ? `url(${playlist!.thumbnail}) center / cover no-repeat, ${mobileTheme.colorWash}`
            : mobileTheme.colorWash
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(transparent, rgba(7,14,27,0.78))",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: `${mobileTheme.spacing.md}px`,
            textAlign: "center"
          }}
        >
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
            {Locale.label("mobile.details.sermonSeries")}
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>
            {playlist?.title || Locale.label("mobile.details.untitledSeries")}
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
                • {sermons.length} {sermons.length !== 1 ? Locale.label("mobile.details.sermonPlural") : Locale.label("mobile.details.sermonSingular")}
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
        border: `1px solid ${tc.border}`,
        borderRadius: `${mobileTheme.radius.xl}px`,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "11px",
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
        {Locale.label("mobile.details.unableToLoadPlaylist")}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.md}px` }}>
        {Locale.label("mobile.details.checkConnection")}
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
        {Locale.label("mobile.details.retry")}
      </Button>
    </Box>
  );

  const renderNotFound = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        border: `1px solid ${tc.border}`,
        borderRadius: `${mobileTheme.radius.xl}px`,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "11px",
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
        {Locale.label("mobile.details.playlistNotFound")}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.md}px` }}>
        {Locale.label("mobile.details.playlistNotFoundDescription")}
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
        {Locale.label("mobile.details.backToSermons")}
      </Button>
    </Box>
  );

  const renderEmptySermons = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        border: `1px solid ${tc.border}`,
        borderRadius: `${mobileTheme.radius.xl}px`,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
      }}
    >
      <Icon sx={{ fontSize: 48, color: tc.textSecondary, mb: 2 }}>video_library</Icon>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 0.5 }}>
        {Locale.label("mobile.details.noSermonsInSeries")}
      </Typography>
      <Typography sx={{ fontSize: 13, color: tc.textMuted }}>
        {Locale.label("mobile.details.noSermonsInSeriesDescription")}
      </Typography>
    </Box>
  );

  const handleSermonClick = (sermon: SermonInterface) => {
    if (!sermon.id) return;
    const params = new URLSearchParams({ playlistId: id });
    if (playlistData?.title) params.set("playlistTitle", playlistData.title);
    router.push(`/mobile/sermons/${sermon.id}?${params.toString()}`);
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
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: tc.textSecondary }}>{Locale.label("mobile.details.sermons")}</Typography>
            {sermons && sermons.length > 0 && (
              <Typography sx={{ fontSize: 13, color: tc.textSecondary }}>
                {sermons.length} {sermons.length !== 1 ? Locale.label("mobile.details.sermonPlural") : Locale.label("mobile.details.sermonSingular")}
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
