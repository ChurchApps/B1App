"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Skeleton, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { mobileTheme } from "../mobileTheme";
import { formatDate } from "../util";
import { BackVerb, FilterPills, PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, SearchField, StatusBadge, TextLink, Thumb, useSliceView } from "../kit";
import { MediaFrame, SermonRow, sermonHref, sermonMeta, useChurchSermons } from "../SermonCard";
import { DateHelper } from "@churchapps/helpers";

interface Props {
  config: ConfigurationInterface;
}

interface StreamService {
  id?: string;
  serviceTime?: string;
  earlyStart?: string;
  label?: string;
  sermon?: SermonInterface;
}

interface StreamConfigPayload {
  services?: StreamService[];
}

interface UpcomingStream {
  startDate: Date;
  title: string;
  description: string;
  isLive: boolean;
}

const formatPrettyDateTime = (date: Date) => {
  try {
    const d = date.toLocaleDateString(DateHelper.locale, { weekday: "long", month: "short", day: "numeric" });
    const t = date.toLocaleTimeString(DateHelper.locale, { hour: "numeric", minute: "2-digit" });
    return `${d} at ${t}`;
  } catch {
    return date.toString();
  }
};

const getSecondsFromDisplay = (value?: string) => {
  if (!value) return 0;
  try {
    const parts = value.split(":");
    if (parts.length < 2) return 0;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  } catch {
    return 0;
  }
};

const sermonYear = (s: SermonInterface) => (s.publishDate ? new Date(s.publishDate).getFullYear() : 0);

const playlistHref = (p: PlaylistInterface) => `/mobile/playlist/${p.id}${p.title ? `?title=${encodeURIComponent(p.title)}` : ""}`;

const RowSkeletons = ({ count = 3 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "12px", minHeight: 70 }}>
        <Skeleton variant="rounded" width={96} height={54} sx={{ borderRadius: "6px" }} />
        <Box sx={{ flex: 1 }}><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="35%" /></Box>
      </Box>
    ))}
  </>
);

export const SermonsPage = ({ config }: Props) => {
  const router = useRouter();
  const tc = mobileTheme.colors;
  const churchId = config?.church?.id;
  const keyName = config?.church?.subDomain;
  const [view, setView] = useSliceView();
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<number | "all" | null>(null);

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: sermons = [], isLoading: sermonsLoading, isError: sermonsError } = useChurchSermons(churchId);

  const { data: playlists = [], isLoading: playlistsLoading, isError: playlistsError } = useQuery<PlaylistInterface[]>({
    queryKey: ["playlists", churchId],
    queryFn: async () => {
      const result = await ApiHelper.getAnonymous(`/playlists/public/${churchId}`, "ContentApi");
      const list: PlaylistInterface[] = Array.isArray(result)
        ? result.filter((p: any) => p && p.id && p.title)
        : [];
      list.sort((a, b) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime());
      return list;
    },
    enabled: !!churchId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const { data: streamConfig } = useQuery<StreamConfigPayload | null>({
    queryKey: ["sermons-stream", keyName],
    queryFn: async () => {
      try {
        const res = await fetch(`${EnvironmentHelper.Common.ContentApi}/preview/data/${keyName}`);
        if (!res.ok) return null;
        return (await res.json()) as StreamConfigPayload;
      } catch {
        return null;
      }
    },
    enabled: !!keyName,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const upcomingStream = useMemo<UpcomingStream | null>(() => {
    const services = streamConfig?.services;
    if (!services || services.length === 0) return null;
    const now = new Date(nowMs);
    let best: { service: StreamService; start: Date; end: Date } | null = null;
    for (const s of services) {
      if (!s.serviceTime) continue;
      const start = new Date(s.serviceTime);
      if (isNaN(start.getTime())) continue;
      const earlySeconds = getSecondsFromDisplay(s.earlyStart);
      const liveStart = new Date(start.getTime() - earlySeconds * 1000);

      const runSeconds = s.sermon?.duration || 5400;
      const end = new Date(start.getTime() + runSeconds * 1000);
      if (end <= now) continue;
      if (!best || liveStart < best.start) {
        best = { service: s, start: liveStart, end };
      }
    }
    if (!best) return null;
    const ms = best.start.getTime() - now.getTime();
    const isLive = ms <= 0 && now <= best.end;
    const withinWindow = isLive || (ms > 0 && ms <= 24 * 60 * 60 * 1000);
    if (!withinWindow) return null;
    return {
      startDate: best.start,
      title: best.service.label || best.service.sermon?.title || "Live Service",
      description: best.service.sermon?.description || "",
      isLive
    };
  }, [streamConfig, nowMs]);

  const featuredSermon = sermons[0] || null;

  const playlistTitles = useMemo(() => new Map(playlists.map((p) => [p.id, p.title])), [playlists]);
  const seriesCounts = useMemo(() => {
    const counts = new Map<string, number>();
    sermons.forEach((s) => { if (s.playlistId) counts.set(s.playlistId, (counts.get(s.playlistId) || 0) + 1); });
    return counts;
  }, [sermons]);

  const years = useMemo(() => Array.from(new Set(sermons.map(sermonYear).filter(Boolean))).sort((a, b) => b - a), [sermons]);
  const activeYear = year ?? years[0] ?? "all";

  const filteredSermons = useMemo(() => {
    const needle = search.trim().toLowerCase();
    // Search spans every year; the year pills only browse.
    if (needle) return sermons.filter((s) => `${s.title || ""} ${s.description || ""}`.toLowerCase().includes(needle));
    return activeYear === "all" ? sermons : sermons.filter((s) => sermonYear(s) === activeYear);
  }, [sermons, search, activeYear]);

  const title = Locale.label("mobile.screenTitles.sermons");
  const backToSermons = <BackVerb label={Locale.label("mobile.details.backToSermons")} onClick={() => setView("")} />;

  const playlistRow = (p: PlaylistInterface) => {
    const count = seriesCounts.get(p.id || "") || 0;
    const subtitle = count
      ? `${count} ${count === 1 ? Locale.label("mobile.details.sermonSingular") : Locale.label("mobile.details.sermonPlural")}`
      : p.description || undefined;
    return (
      <Row key={p.id} href={playlistHref(p)} leading={<Thumb src={p.thumbnail?.trim() || undefined} />} title={p.title || Locale.label("mobile.details.untitledSeries")} subtitle={subtitle} chevron />
    );
  };

  if (sermonsError || playlistsError) {
    return (
      <Box>
        <PageHead title={title} />
        <Plate>
          <PlateSection>
            <Typography component="h2" sx={{ fontSize: 17, fontWeight: 650, color: tc.text }}>{Locale.label("mobile.screens.sermonsLoadError")}</Typography>
            <QuietEmpty sx={{ mt: "4px", mb: "12px" }}>{Locale.label("mobile.screens.sermonsLoadErrorBody")}</QuietEmpty>
            <TextLink onClick={() => router.back()}>{Locale.label("mobile.screens.sermonsGoBack")}</TextLink>
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  if (view === "all") {
    return (
      <Box>
        {backToSermons}
        <PageHead title={Locale.label("mobile.sermons.allSermons")} />
        <Plate>
          <PlateSection>
            <SearchField value={search} onChange={setSearch} label={Locale.label("mobile.sermons.searchSermons")} placeholder={Locale.label("mobile.sermons.searchSermons")} />
            {years.length > 1 && !search.trim() && (
              <Box sx={{ mt: "14px" }}>
                <FilterPills<number | "all">
                  label={Locale.label("mobile.sermons.filterByYear")}
                  value={activeYear}
                  onChange={setYear}
                  options={[...years.map((y) => ({ value: y, label: String(y) })), { value: "all" as const, label: Locale.label("mobile.sermons.allYears") }]}
                />
              </Box>
            )}
            <RowList sx={{ mt: "8px" }}>
              {sermonsLoading
                ? <RowSkeletons count={5} />
                : filteredSermons.map((s) => <SermonRow key={s.id} sermon={s} href={sermonHref(s)} />)}
            </RowList>
            {!sermonsLoading && filteredSermons.length === 0 && (
              <QuietEmpty sx={{ mt: "12px" }}>{Locale.label(sermons.length ? "mobile.sermons.noMatches" : "mobile.sermons.noSermons")}</QuietEmpty>
            )}
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  if (view === "series") {
    return (
      <Box>
        {backToSermons}
        <PageHead title={Locale.label("mobile.sermons.allSeries")} />
        <Plate>
          <PlateSection>
            {playlistsLoading
              ? <RowSkeletons count={4} />
              : playlists.length === 0
                ? <QuietEmpty>{Locale.label("mobile.sermons.noSeries")}</QuietEmpty>
                : <RowList>{playlists.map(playlistRow)}</RowList>}
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  const loading = sermonsLoading || playlistsLoading;
  const recent = sermons.slice(1, 4);

  return (
    <Box>
      <PageHead title={title}>
        {upcomingStream?.isLive
          ? <Button variant="contained" component={Link} href="/mobile/stream" startIcon={<LiveTvIcon />}>{Locale.label("mobile.screens.watchLive")}</Button>
          : featuredSermon && <Button variant="contained" component={Link} href={sermonHref(featuredSermon)} startIcon={<PlayArrowIcon />}>{Locale.label("mobile.sermons.watchLatest")}</Button>}
      </PageHead>
      <Plate>
        {loading && (
          <PlateSection>
            <Skeleton variant="rounded" sx={{ width: "100%", maxWidth: 720, height: "auto", aspectRatio: "16 / 9", borderRadius: "10px" }} />
            <RowSkeletons />
          </PlateSection>
        )}

        {!loading && featuredSermon && (
          <PlateSection title={Locale.label("mobile.sermons.latest")}>
            <Box sx={{ maxWidth: 720 }}>
              <MediaFrame
                href={sermonHref(featuredSermon)}
                ariaLabel={`${Locale.label("mobile.components.playSermon")}: ${featuredSermon.title || ""}`}
                src={featuredSermon.thumbnail}
                kicker={playlistTitles.get(featuredSermon.playlistId || "") || formatDate(featuredSermon.publishDate, "short")}
                title={featuredSermon.title}
                play
              />
            </Box>
            <Typography sx={{ mt: "12px", fontSize: 16, lineHeight: "22px", fontWeight: 600, color: tc.text }}>
              {featuredSermon.title || Locale.label("mobile.components.untitledSermon")}
            </Typography>
            {sermonMeta(featuredSermon) && <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>{sermonMeta(featuredSermon)}</Typography>}
          </PlateSection>
        )}

        {!loading && upcomingStream && (
          <PlateSection title={Locale.label("mobile.sermons.live")}>
            <Row
              href="/mobile/stream"
              leading={<LiveTvIcon sx={{ color: tc.textSecondary }} />}
              title={upcomingStream.title}
              subtitle={upcomingStream.isLive
                ? upcomingStream.description || undefined
                : `${Locale.label("mobile.screens.nextService")} · ${formatPrettyDateTime(upcomingStream.startDate)}`}
              trailing={upcomingStream.isLive ? <StatusBadge tone="bad" dot>{Locale.label("mobile.stream.live")}</StatusBadge> : undefined}
              chevron
            />
          </PlateSection>
        )}

        {!loading && (
          <PlateSection
            title={Locale.label("mobile.screens.tabRecent")}
            action={sermons.length > 0 ? <TextLink onClick={() => setView("all")}>{Locale.label("mobile.sermons.allSermons")}</TextLink> : undefined}
          >
            {sermons.length === 0
              ? <QuietEmpty>{Locale.label("mobile.sermons.noSermons")}</QuietEmpty>
              : recent.length > 0 && <RowList>{recent.map((s) => <SermonRow key={s.id} sermon={s} href={sermonHref(s)} />)}</RowList>}
          </PlateSection>
        )}

        {!loading && (
          <PlateSection
            id="sermon-series"
            title={Locale.label("mobile.screens.tabSeries")}
            action={playlists.length > 0 ? <TextLink onClick={() => setView("series")}>{Locale.label("mobile.sermons.allSeries")}</TextLink> : undefined}
          >
            {playlists.length === 0
              ? <QuietEmpty>{Locale.label("mobile.sermons.noSeries")}</QuietEmpty>
              : <RowList>{playlists.slice(0, 3).map(playlistRow)}</RowList>}
          </PlateSection>
        )}
      </Plate>
    </Box>
  );
};
