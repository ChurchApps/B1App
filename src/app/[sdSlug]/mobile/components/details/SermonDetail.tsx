"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Button, Skeleton, Snackbar, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShareIcon from "@mui/icons-material/Share";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { PageHead, Plate, PlateSection, QuietEmpty, RowList, TextLink } from "../kit";
import { MediaFrame, SermonRow, sermonHref, sermonMeta, useChurchSermons } from "../SermonCard";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

const safeHttpUrl = (url?: string) => (url && /^https?:\/\//i.test(url) ? url : null);

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
      default: return safeHttpUrl(videoData);
    }
  }

  return safeHttpUrl(videoUrl);
};

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
      default: return safeHttpUrl(videoData);
    }
  }

  return safeHttpUrl(videoUrl);
};

export const SermonDetail = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
  const churchId = config?.church?.id;

  const [showVideo, setShowVideo] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const { data: sermon = null, isLoading: loading, isError } = useQuery<SermonInterface | null>({
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

        }
      }
      return found;
    },
    enabled: !!id
  });

  const searchParams = useSearchParams();
  const paramPlaylistId = searchParams?.get("playlistId") || undefined;
  const paramPlaylistTitle = searchParams?.get("playlistTitle") || undefined;

  const playlistId = sermon?.playlistId || paramPlaylistId;

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

      }
      return null;
    },
    enabled: !!churchId && !!playlistId,
    placeholderData: paramPlaylistTitle,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const { data: churchSermons = [] } = useChurchSermons(playlistId ? churchId : undefined);
  const inSeries = useMemo(() => churchSermons.filter((s) => s.playlistId === playlistId && s.id !== id).slice(0, 3), [churchSermons, playlistId, id]);

  const embedUrl = useMemo(() => buildEmbedUrl(sermon), [sermon]);
  const externalUrl = useMemo(() => buildExternalUrl(sermon), [sermon]);

  const handleShare = useCallback(async () => {
    if (!sermon) return;
    const shareUrl =
      externalUrl ||
      (typeof window !== "undefined" ? window.location.href : "");
    const title = sermon.title || Locale.label("mobile.screenTitles.sermonDetails");
    const text = `${Locale.label("mobile.details.checkOutSermon").replace("{}", title)} ${shareUrl}`.trim();

    try {
      if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
        await (navigator as any).share({ title, text, url: shareUrl });
        return;
      }
    } catch {

    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setSnackbar(Locale.label("mobile.details.linkCopied"));
        return;
      }
    } catch {

    }
    setSnackbar(Locale.label("mobile.details.unableToShare"));
  }, [sermon, externalUrl]);

  const handleOpenExternal = useCallback(() => {
    if (!externalUrl || typeof window === "undefined") return;
    window.open(externalUrl, "_blank", "noopener,noreferrer");
  }, [externalUrl]);

  if (loading) {
    return (
      <Box>
        <Box sx={{ px: { xs: "12px", md: 0 }, pb: "16px" }}>
          <Skeleton variant="rounded" sx={{ width: "100%", maxWidth: 880, height: "auto", aspectRatio: "16 / 9", borderRadius: "10px" }} />
        </Box>
        <PageHead title={<Skeleton variant="text" width="60%" />} />
      </Box>
    );
  }

  if (isError || !sermon) {
    const titleKey = isError ? "mobile.details.sermonLoadError" : "mobile.details.sermonNotAvailable";
    const bodyKey = isError ? "mobile.details.sermonLoadErrorBody" : "mobile.details.sermonRemoved";
    return (
      <Box>
        <PageHead title={Locale.label(titleKey)} lede={Locale.label(bodyKey)}>
          <TextLink href="/mobile/sermons">{Locale.label("mobile.details.backToSermons")}</TextLink>
        </PageHead>
      </Box>
    );
  }

  const description = sermon.description;
  const canPlay = !!embedUrl;
  const showPlayer = showVideo && canPlay;
  const sermonTitle = sermon.title || Locale.label("mobile.components.untitledSermon");
  const seriesHref = playlistId ? `/mobile/playlist/${playlistId}${playlistTitle ? `?title=${encodeURIComponent(playlistTitle)}` : ""}` : "";

  return (
    <Box>
      <Box sx={{ px: { xs: "12px", md: 0 }, pb: "16px" }}>
        <Box sx={{ maxWidth: 880 }}>
          {showPlayer
            ? (
              <MediaFrame>
                <iframe
                  src={embedUrl!}
                  title={sermonTitle}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  allow="autoplay; fullscreen; picture-in-picture"
                />
              </MediaFrame>
            )
            : (
              <MediaFrame
                src={sermon.thumbnail}
                kicker={playlistTitle || undefined}
                title={sermonTitle}
                play={canPlay}
                onClick={canPlay ? () => setShowVideo(true) : undefined}
                ariaLabel={canPlay ? Locale.label("mobile.components.playSermon") : undefined}
              />
            )}
        </Box>
      </Box>

      <PageHead
        title={sermonTitle}
        lede={(
          <>
            {sermonMeta(sermon)}
            {playlistTitle && seriesHref && <Box component="span" sx={{ display: "block", mt: "2px" }}><TextLink href={seriesHref}>{playlistTitle}</TextLink></Box>}
          </>
        )}
      >
        {canPlay && !showPlayer && (
          <Button variant="contained" onClick={() => setShowVideo(true)} startIcon={<PlayArrowIcon />}>
            {Locale.label("mobile.details.watchSermon")}
          </Button>
        )}
        <Button variant="outlined" onClick={handleShare} startIcon={<ShareIcon />}>
          {Locale.label("mobile.details.share")}
        </Button>
        <TextLink onClick={handleOpenExternal} disabled={!externalUrl}>
          {Locale.label("mobile.details.openLink")}
        </TextLink>
      </PageHead>

      {(description || playlistId) && (
        <Plate>
          {description && (
            <PlateSection title={Locale.label("mobile.details.about")}>
              <Typography sx={{ fontSize: 15, lineHeight: "23px", color: tc.text, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {description}
              </Typography>
            </PlateSection>
          )}
          {playlistId && (
            <PlateSection
              title={Locale.label("mobile.sermons.inThisSeries")}
              action={<TextLink href={seriesHref}>{Locale.label("mobile.sermons.allInSeries")}</TextLink>}
            >
              {inSeries.length > 0
                ? <RowList>{inSeries.map((s) => <SermonRow key={s.id} sermon={s} href={sermonHref(s, { playlistId, playlistTitle: playlistTitle || undefined })} />)}</RowList>
                : <QuietEmpty>{Locale.label("mobile.sermons.noOtherSermons")}</QuietEmpty>}
            </PlateSection>
          )}
        </Plate>
      )}

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
