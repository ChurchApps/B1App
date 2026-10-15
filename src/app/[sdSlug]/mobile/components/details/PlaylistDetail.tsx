"use client";

import React from "react";
import Link from "next/link";
import { Box, Button, Skeleton, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { formatDate } from "../util";
import { PageHead, Plate, PlateSection, QuietEmpty, RowList, TextLink } from "../kit";
import { MediaFrame, SermonRow, sermonHref } from "../SermonCard";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

export const PlaylistDetail = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
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

  const sermonUrl = (sermon: SermonInterface) => sermonHref(sermon, { playlistId: id, playlistTitle: playlistData?.title });

  if (hasError) {
    return (
      <Box>
        <PageHead title={Locale.label("mobile.details.unableToLoadPlaylist")} lede={Locale.label("mobile.details.checkConnection")}>
          <Button variant="contained" onClick={handleRetry}>{Locale.label("mobile.details.retry")}</Button>
        </PageHead>
      </Box>
    );
  }

  if (playlist === undefined) {
    return (
      <Box>
        <Box sx={{ px: { xs: "12px", md: 0 }, pb: "16px" }}>
          <Skeleton variant="rounded" sx={{ width: "100%", maxWidth: 720, height: "auto", aspectRatio: "16 / 9", borderRadius: "10px" }} />
        </Box>
        <PageHead title={<Skeleton variant="text" width="60%" />} />
      </Box>
    );
  }

  if (playlist === null) {
    return (
      <Box>
        <PageHead title={Locale.label("mobile.details.playlistNotFound")} lede={Locale.label("mobile.details.playlistNotFoundDescription")}>
          <TextLink href="/mobile/sermons">{Locale.label("mobile.details.backToSermons")}</TextLink>
        </PageHead>
      </Box>
    );
  }

  // A series reads start to finish, so the rows run oldest first.
  const ordered = sermons ? [...sermons].reverse() : null;
  const countLabel = sermons && sermons.length > 0
    ? `${sermons.length} ${sermons.length !== 1 ? Locale.label("mobile.details.sermonPlural") : Locale.label("mobile.details.sermonSingular")}`
    : "";
  const lede = [countLabel, playlist.publishDate ? formatDate(playlist.publishDate) : ""].filter(Boolean).join(" · ");
  const seriesTitle = playlist.title || Locale.label("mobile.details.untitledSeries");

  return (
    <Box>
      <Box sx={{ px: { xs: "12px", md: 0 }, pb: "16px" }}>
        <Box sx={{ maxWidth: 720 }}>
          <MediaFrame src={playlist.thumbnail} kicker={Locale.label("mobile.details.sermonSeries")} title={seriesTitle} />
        </Box>
      </Box>
      <PageHead title={seriesTitle} lede={lede || undefined}>
        {ordered && ordered.length > 0 && (
          <Button variant="contained" component={Link} href={sermonUrl(ordered[0])} startIcon={<PlayArrowIcon />}>
            {Locale.label("mobile.sermons.playFromStart")}
          </Button>
        )}
      </PageHead>
      <Plate>
        {playlist.description && (
          <PlateSection title={Locale.label("mobile.details.about")}>
            <Typography sx={{ fontSize: 15, lineHeight: "23px", color: tc.text, whiteSpace: "pre-wrap" }}>{playlist.description}</Typography>
          </PlateSection>
        )}
        <PlateSection title={Locale.label("mobile.details.sermons")}>
          {ordered === null && [0, 1, 2].map((i) => <Skeleton key={i} variant="text" height={56} />)}
          {ordered && ordered.length === 0 && (
            <QuietEmpty>{Locale.label("mobile.details.noSermonsInSeriesDescription")}</QuietEmpty>
          )}
          {ordered && ordered.length > 0 && (
            <RowList>
              {ordered.map((s, i) => (
                <SermonRow
                  key={s.id}
                  sermon={s}
                  href={sermonUrl(s)}
                  leading={<Box component="span" sx={{ width: 20, flex: "none", color: tc.textSecondary, fontVariantNumeric: "tabular-nums", fontSize: 15 }}>{i + 1}</Box>}
                  trailing={<PlayArrowIcon sx={{ color: tc.textSecondary, fontSize: 20, flex: "none" }} />}
                />
              ))}
            </RowList>
          )}
        </PlateSection>
      </Plate>
    </Box>
  );
};

export default PlaylistDetail;
