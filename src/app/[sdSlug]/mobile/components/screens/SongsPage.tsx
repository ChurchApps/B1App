"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { LoadErrorAlert } from "../LoadErrorAlert";
import { SongDialog } from "../plans/SongDialog";
import { Highlight, PageHead, Pill, PillRow, Plate, PlateSection, QuietEmpty, SearchField, SignInPrompt } from "../kit";

interface Props {
  config: ConfigurationInterface;
}

// One row of /songs/search: a song detail joined with one of its arrangement keys.
interface SongSearchRow {
  id: string;
  title?: string;
  artist?: string;
  arrangementKeyId: string;
  arrangementKeySignature?: string;
  arrangementName?: string;
  shortDescription?: string;
}

interface SongGroup {
  id: string;
  title: string;
  artist: string;
  keys: SongSearchRow[];
}

// The endpoint caps at 100 rows by default; libraries are listed in full and narrowed server-side.
const SEARCH_LIMIT = 500;

export const SongsPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [dialogKeyId, setDialogKeyId] = useState<string>();

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchText.trim()), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const { data: rows, isLoading, isError, refetch } = useQuery<SongSearchRow[]>({
    queryKey: ["/songs/search", "ContentApi", query],
    queryFn: async () => {
      const data = await ApiHelper.get(`/songs/search?q=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`, "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const songs = useMemo(() => {
    const groups = new Map<string, SongGroup>();
    (rows || []).forEach((r) => {
      let g = groups.get(r.id);
      if (!g) {
        g = { id: r.id, title: r.title || "", artist: r.artist || "", keys: [] };
        groups.set(r.id, g);
      }
      g.keys.push(r);
    });
    return [...groups.values()];
  }, [rows]);

  if (!loggedIn) return <SignInPrompt title={Locale.label("mobile.songs.signedOutTitle")} lede={Locale.label("mobile.songs.signedOutBody")} />;

  const keyLabel = (k: SongSearchRow) => Locale.label("mobile.songs.keyOf").replace("{}", k.arrangementKeySignature || "?");

  const renderSong = (song: SongGroup) => {
    const multipleArrangements = new Set(song.keys.map((k) => k.arrangementName)).size > 1;
    return (
      <Box key={song.id} data-testid="song-row" sx={{ py: "12px", "& + &": { borderTop: `1px solid ${tc.border}` } }}>
        <Typography component="h3" sx={{ fontSize: 15, lineHeight: "21px", fontWeight: 500, color: tc.text, overflowWrap: "anywhere" }}>
          <Highlight text={song.title} term={searchText} />
        </Typography>
        {song.artist && <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}><Highlight text={song.artist} term={searchText} /></Typography>}
        <PillRow sx={{ mt: "8px" }}>
          {song.keys.map((k) => {
            // Name the arrangement only when the song has several and the key's description doesn't already say it.
            const showArrangement = multipleArrangements && !!k.arrangementName && !(k.shortDescription || "").toLowerCase().includes(k.arrangementName.toLowerCase());
            const qualifier = [showArrangement ? k.arrangementName : "", k.shortDescription].filter(Boolean).join(" · ");
            return <Pill key={k.arrangementKeyId} onClick={() => setDialogKeyId(k.arrangementKeyId)} qualifier={qualifier ? ` · ${qualifier}` : undefined}>{keyLabel(k)}</Pill>;
          })}
        </PillRow>
      </Box>
    );
  };

  const renderSkeleton = () => (
    <Box>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ py: "10px" }}>
          <Skeleton variant="text" width="45%" height={22} />
          <Skeleton variant="text" width="30%" height={18} />
        </Box>
      ))}
    </Box>
  );

  const renderList = () => {
    if (isLoading) return renderSkeleton();
    if (isError && !rows) return <LoadErrorAlert onRetry={() => refetch()} />;
    if (songs.length === 0) return <QuietEmpty>{query ? Locale.label("mobile.songs.noMatches") : Locale.label("mobile.songs.empty")}</QuietEmpty>;
    return <Box>{songs.map(renderSong)}</Box>;
  };

  return (
    <Box>
      <PageHead title={Locale.label("mobile.screenTitles.songs")} />
      <Plate>
        <PlateSection>
          <SearchField value={searchText} onChange={setSearchText} label={Locale.label("mobile.songs.search")} sx={{ mb: "8px" }} />
          {renderList()}
        </PlateSection>
      </Plate>
      {dialogKeyId && <SongDialog arrangementKeyId={dialogKeyId} onClose={() => setDialogKeyId(undefined)} />}
    </Box>
  );
};
