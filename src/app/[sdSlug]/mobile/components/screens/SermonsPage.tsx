"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Tab, Tabs, Typography } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { mobileTheme } from "../mobileTheme";

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
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

const formatPrettyDateTime = (date: Date) => {
  try {
    const d = date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    const t = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
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

const FeaturedSermonHero = ({ sermon, onClick }: { sermon: SermonInterface; onClick: () => void }) => {
  const tc = mobileTheme.colors;
  const hasImage = !!(sermon.thumbnail && sermon.thumbnail.trim() !== "");

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      sx={{
        position: "relative",
        width: "100%",
        paddingTop: "56.25%",
        mb: `${mobileTheme.spacing.lg}px`,
        borderRadius: `${mobileTheme.radius.xl}px`,
        overflow: "hidden",
        boxShadow: mobileTheme.shadows.lg,
        cursor: "pointer",
        backgroundImage: hasImage
          ? `url(${sermon.thumbnail})`
          : `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "box-shadow 200ms ease",
        "&:hover": { boxShadow: mobileTheme.shadows.lg },
      }}
    >
      {!hasImage && (
        <Box sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.9,
        }}>
          <Icon sx={{ fontSize: 72, color: "#FFFFFF" }}>video_library</Icon>
        </Box>
      )}

      <Box sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: `${mobileTheme.spacing.md}px`,
        p: `${mobileTheme.spacing.lg}px`,
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            opacity: 0.9,
            mb: 1,
          }}>
            Latest Sermon
          </Typography>
          <Typography sx={{
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: 22,
            lineHeight: 1.2,
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}>
            {sermon.title || "Untitled Sermon"}
          </Typography>
          {sermon.publishDate && (
            <Typography sx={{ color: "#FFFFFF", opacity: 0.9, fontSize: 14, mb: 0.5 }}>
              {formatDate(sermon.publishDate)}
            </Typography>
          )}
          {sermon.duration ? (
            <Typography sx={{ color: "#FFFFFF", opacity: 0.8, fontSize: 12 }}>
              {formatDuration(sermon.duration)}
            </Typography>
          ) : null}
        </Box>
        <Box sx={{
          flexShrink: 0,
          bgcolor: `color-mix(in srgb, ${tc.primary} 90%, transparent)`,
          borderRadius: "28px",
          width: 56,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: mobileTheme.shadows.md,
        }}>
          <Icon sx={{ fontSize: 32, color: tc.onPrimary }}>play_arrow</Icon>
        </Box>
      </Box>
    </Box>
  );
};

const LiveStreamCard = ({ stream }: { stream: UpcomingStream }) => {
  const tc = mobileTheme.colors;
  const now = new Date();
  const diffMs = stream.startDate.getTime() - now.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

  if (stream.isLive) {
    return (
      <Box
        role="button"
        tabIndex={0}
        onClick={() => { window.location.href = "/mobile/stream"; }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { window.location.href = "/mobile/stream"; } }}
        sx={{
          background: "linear-gradient(135deg, #D32F2F 0%, #F44336 100%)",
          borderRadius: `${mobileTheme.radius.xl}px`,
          p: `${mobileTheme.spacing.lg}px`,
          mb: `${mobileTheme.spacing.lg}px`,
          boxShadow: mobileTheme.shadows.lg,
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: "6px",
            bgcolor: "#FFFFFF",
            animation: "pulse 1.4s ease-in-out infinite",
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.4 },
            },
          }} />
          <Typography sx={{ color: "#FFFFFF", fontWeight: 800, letterSpacing: 1.5, fontSize: 14 }}>
            LIVE NOW
          </Typography>
        </Box>
        <Typography sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: 20, mb: 1 }}>
          {stream.title}
        </Typography>
        {stream.description && (
          <Typography sx={{ color: "#FFFFFF", opacity: 0.9, fontSize: 14, mb: 2 }}>
            {stream.description}
          </Typography>
        )}
        <Box sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "#FFFFFF",
          color: "#D32F2F",
          px: 2.5,
          py: 1,
          borderRadius: "24px",
          fontWeight: 700,
        }}>
          <Icon sx={{ fontSize: 20 }}>play_circle</Icon>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Watch Live</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      background: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
      borderRadius: `${mobileTheme.radius.xl}px`,
      p: `${mobileTheme.spacing.lg}px`,
      mb: `${mobileTheme.spacing.lg}px`,
      boxShadow: mobileTheme.shadows.lg,
      textAlign: "center",
    }}>
      <Typography sx={{
        color: "#FFFFFF",
        fontWeight: 600,
        letterSpacing: 1,
        fontSize: 12,
        textTransform: "uppercase",
        mb: 2,
      }}>
        Next Service In
      </Typography>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 3, mb: 2 }}>
        {days > 0 && (
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ color: "#FFFFFF", fontWeight: 800, fontSize: 36, lineHeight: 1 }}>{days}</Typography>
            <Typography sx={{ color: "#FFFFFF", opacity: 0.85, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
              {days === 1 ? "Day" : "Days"}
            </Typography>
          </Box>
        )}
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "#FFFFFF", fontWeight: 800, fontSize: 36, lineHeight: 1 }}>{hours}</Typography>
          <Typography sx={{ color: "#FFFFFF", opacity: 0.85, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
            {hours === 1 ? "Hour" : "Hours"}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "#FFFFFF", fontWeight: 800, fontSize: 36, lineHeight: 1 }}>{minutes}</Typography>
          <Typography sx={{ color: "#FFFFFF", opacity: 0.85, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
            {minutes === 1 ? "Minute" : "Minutes"}
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: 18, mb: 0.5 }}>
        {stream.title}
      </Typography>
      {stream.description && (
        <Typography sx={{ color: "#FFFFFF", opacity: 0.9, fontSize: 14, mb: 1 }}>
          {stream.description}
        </Typography>
      )}
      <Typography sx={{ color: "#FFFFFF", opacity: 0.85, fontSize: 13 }}>
        {formatPrettyDateTime(stream.startDate)}
      </Typography>
    </Box>
  );
};

const SermonCard = ({ sermon, onClick }: { sermon: SermonInterface; onClick: () => void }) => {
  const tc = mobileTheme.colors;
  const hasImage = !!(sermon.thumbnail && sermon.thumbnail.trim() !== "");

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      sx={{
        position: "relative",
        width: "100%",
        paddingTop: "56.25%",
        mb: `${mobileTheme.spacing.md - 4}px`,
        borderRadius: `${mobileTheme.radius.xl}px`,
        overflow: "hidden",
        boxShadow: mobileTheme.shadows.md,
        cursor: "pointer",
        bgcolor: tc.primary,
        backgroundImage: hasImage ? `url(${sermon.thumbnail})` : `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "box-shadow 200ms ease",
        "&:hover": { boxShadow: mobileTheme.shadows.lg },
      }}
    >
      {!hasImage && (
        <Box sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.9,
        }}>
          <Icon sx={{ fontSize: 56, color: "#FFFFFF" }}>play_circle_outline</Icon>
        </Box>
      )}

      <Box sx={{
        position: "absolute",
        top: 12,
        right: 12,
        bgcolor: "rgba(0,0,0,0.7)",
        borderRadius: "20px",
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Icon sx={{ fontSize: 24, color: "#FFFFFF" }}>play_circle_filled</Icon>
      </Box>

      {sermon.duration ? (
        <Box sx={{
          position: "absolute",
          top: 12,
          left: 12,
          bgcolor: "rgba(0,0,0,0.8)",
          borderRadius: `${mobileTheme.radius.sm + 4}px`,
          px: "8px",
          py: "4px",
        }}>
          <Typography sx={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600 }}>
            {formatDuration(sermon.duration)}
          </Typography>
        </Box>
      ) : null}

      <Box sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 100%)",
        p: "16px",
        pt: "32px",
      }}>
        <Typography sx={{
          color: "#FFFFFF",
          fontWeight: 600,
          fontSize: 16,
          mb: 0.5,
          lineHeight: 1.2,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
        }}>
          {sermon.title || "Untitled Sermon"}
        </Typography>
        <Typography sx={{ color: "#FFFFFF", opacity: 0.9, fontSize: 12, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
          {formatDate(sermon.publishDate)}
        </Typography>
      </Box>
    </Box>
  );
};

const PlaylistCard = ({ playlist, onClick }: { playlist: PlaylistInterface; onClick: () => void }) => {
  const tc = mobileTheme.colors;
  const hasImage = !!(playlist.thumbnail && playlist.thumbnail.trim() !== "");

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      sx={{
        position: "relative",
        width: "100%",
        paddingTop: "56.25%",
        mb: `${mobileTheme.spacing.md - 4}px`,
        borderRadius: `${mobileTheme.radius.xl}px`,
        overflow: "hidden",
        boxShadow: mobileTheme.shadows.md,
        cursor: "pointer",
        backgroundImage: hasImage
          ? `url(${playlist.thumbnail})`
          : `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "box-shadow 200ms ease",
        "&:hover": { boxShadow: mobileTheme.shadows.lg },
      }}
    >
      {!hasImage && (
        <Box sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.9,
        }}>
          <Icon sx={{ fontSize: 56, color: "#FFFFFF" }}>playlist_play</Icon>
        </Box>
      )}

      <Box sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 100%)",
        p: "16px",
        pt: "32px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 1,
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: 16,
            mb: 0.5,
            lineHeight: 1.2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}>
            {playlist.title || "Untitled Series"}
          </Typography>
          {playlist.description ? (
            <Typography sx={{
              color: "#FFFFFF",
              opacity: 0.9,
              fontSize: 14,
              mb: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}>
              {playlist.description}
            </Typography>
          ) : null}
          {playlist.publishDate && (
            <Typography sx={{ color: "#FFFFFF", opacity: 0.85, fontSize: 12, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
              {formatDate(playlist.publishDate)}
            </Typography>
          )}
        </Box>
        <Icon sx={{ fontSize: 24, color: "#FFFFFF" }}>chevron_right</Icon>
      </Box>
    </Box>
  );
};

const SkeletonCard = () => {
  const tc = mobileTheme.colors;
  return (
    <Box sx={{
      position: "relative",
      width: "100%",
      paddingTop: "56.25%",
      mb: `${mobileTheme.spacing.md - 4}px`,
      borderRadius: `${mobileTheme.radius.xl}px`,
      overflow: "hidden",
      bgcolor: tc.surfaceVariant,
      boxShadow: mobileTheme.shadows.sm,
    }} />
  );
};

const EmptyState = ({ type }: { type: "sermons" | "playlists" }) => {
  const tc = mobileTheme.colors;
  const isPlaylists = type === "playlists";
  return (
    <Box sx={{
      bgcolor: tc.surface,
      borderRadius: `${mobileTheme.radius.xl}px`,
      p: 4,
      textAlign: "center",
      boxShadow: mobileTheme.shadows.md,
      mt: 2,
    }}>
      <Box sx={{
        width: 72,
        height: 72,
        borderRadius: "36px",
        bgcolor: tc.iconBackground,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        mb: 2,
      }}>
        <Icon sx={{ fontSize: 36, color: tc.primary }}>
          {isPlaylists ? "playlist_add" : "video_library"}
        </Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
        {isPlaylists ? "No Sermon Series Available" : "No Recent Sermons"}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        {isPlaylists
          ? "Check back later for new sermon series from your church."
          : "Check back later for new sermons from your church."}
      </Typography>
    </Box>
  );
};

export const SermonsPage = ({ config }: Props) => {
  const router = useRouter();
  const tc = mobileTheme.colors;
  const churchId = config?.church?.id;
  const keyName = config?.church?.subDomain;
  const [activeTab, setActiveTab] = useState<"series" | "recent">("series");
  // Re-render the countdown roughly every minute so the timer stays accurate.
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: sermons = [], isLoading: sermonsLoading } = useQuery<SermonInterface[]>({
    queryKey: ["sermons", churchId],
    queryFn: async () => {
      const result = await ApiHelper.getAnonymous(`/sermons/public/${churchId}`, "ContentApi");
      const list: SermonInterface[] = Array.isArray(result)
        ? result.filter((s: any) => s && s.id && s.title)
        : [];
      list.sort((a, b) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime());
      return list;
    },
    enabled: !!churchId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const { data: playlists = [], isLoading: playlistsLoading } = useQuery<PlaylistInterface[]>({
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
    gcTime: 30 * 60 * 1000,
  });

  // Fetch real stream schedule from ContentApi preview/data so the countdown
  // reflects the church's actual configured services (not hard-coded sample data).
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
    gcTime: 15 * 60 * 1000,
  });

  const upcomingStream = useMemo<UpcomingStream | null>(() => {
    const services = streamConfig?.services;
    if (!services || services.length === 0) return null;
    const now = new Date();
    let best: { service: StreamService; start: Date; end: Date } | null = null;
    for (const s of services) {
      if (!s.serviceTime) continue;
      const start = new Date(s.serviceTime);
      if (isNaN(start.getTime())) continue;
      const earlySeconds = getSecondsFromDisplay(s.earlyStart);
      const liveStart = new Date(start.getTime() - earlySeconds * 1000);
      // Assume ~90 minutes of run time if the sermon duration isn't published.
      const runSeconds = s.sermon?.duration || 5400;
      const end = new Date(start.getTime() + runSeconds * 1000);
      if (end <= now) continue;
      if (!best || liveStart < new Date(best.start.getTime() - getSecondsFromDisplay(best.service.earlyStart) * 1000)) {
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
      isLive,
    };
  }, [streamConfig]);

  const featuredSermon = useMemo<SermonInterface | null>(() => {
    if (!sermons || sermons.length === 0) return null;
    return sermons[0];
  }, [sermons]);

  const handleSermonClick = (sermon: SermonInterface) => {
    if (!sermon.id) return;
    const qs = sermon.title ? `?title=${encodeURIComponent(sermon.title)}` : "";
    router.push(`/mobile/sermons/${sermon.id}${qs}`);
  };

  const handlePlaylistClick = (playlist: PlaylistInterface) => {
    if (!playlist.id) return;
    const qs = playlist.title ? `?title=${encodeURIComponent(playlist.title)}` : "";
    router.push(`/mobile/playlist/${playlist.id}${qs}`);
  };

  const renderSkeletons = () => (
    <>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </>
  );

  const renderSeriesTab = () => {
    if (playlistsLoading || sermonsLoading) return renderSkeletons();
    return (
      <>
        {upcomingStream ? (
          <LiveStreamCard stream={upcomingStream} />
        ) : featuredSermon ? (
          <FeaturedSermonHero sermon={featuredSermon} onClick={() => handleSermonClick(featuredSermon)} />
        ) : null}

        <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: 2 }}>
          Sermon Series
        </Typography>

        {playlists.length === 0
          ? <EmptyState type="playlists" />
          : playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} onClick={() => handlePlaylistClick(p)} />
          ))}
      </>
    );
  };

  const renderRecentTab = () => {
    if (sermonsLoading) return renderSkeletons();
    return (
      <>
        {upcomingStream ? <LiveStreamCard stream={upcomingStream} /> : null}

        <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: 2 }}>
          Recent Sermons
        </Typography>

        {sermons.length === 0
          ? <EmptyState type="sermons" />
          : sermons.map((s) => (
            <SermonCard key={s.id} sermon={s} onClick={() => handleSermonClick(s)} />
          ))}
      </>
    );
  };

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{
        borderBottom: `1px solid ${tc.border}`,
        bgcolor: tc.surface,
      }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 52,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              minHeight: 52,
              color: tc.textSecondary,
            },
            "& .Mui-selected": { color: `${tc.primary} !important`, fontWeight: 700 },
            "& .MuiTabs-indicator": { backgroundColor: tc.primary, height: 2 },
          }}
        >
          <Tab value="series" label="Series" />
          <Tab value="recent" label="Recent" />
        </Tabs>
      </Box>
      <Box sx={{ p: `${mobileTheme.spacing.md}px` }}>
        {activeTab === "series" ? renderSeriesTab() : renderRecentTab()}
      </Box>
    </Box>
  );
};
