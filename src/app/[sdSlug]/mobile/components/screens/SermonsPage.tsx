"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Typography } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import type { SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
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
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
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

      {/* Play button top-right */}
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

      {/* Duration badge top-left */}
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

      {/* Title + date overlay */}
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

export const SermonsPage = ({ config }: Props) => {
  const router = useRouter();
  const tc = mobileTheme.colors;
  const [sermons, setSermons] = useState<SermonInterface[]>([]);
  const [loading, setLoading] = useState(true);

  const churchId = config?.church?.id;

  useEffect(() => {
    if (!churchId) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const result = await ApiHelper.getAnonymous(`/sermons/public/${churchId}`, "ContentApi");
        if (cancelled) return;
        const list: SermonInterface[] = Array.isArray(result)
          ? result.filter((s: any) => s && s.id && s.title)
          : [];
        list.sort((a, b) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime());
        setSermons(list);
      } catch (err) {
        console.error("Failed to load sermons", err);
        if (!cancelled) setSermons([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [churchId]);

  const handleSermonClick = (sermon: SermonInterface) => {
    if (!sermon.id) return;
    router.push(`/mobile/sermons/${sermon.id}`);
  };

  const content = useMemo(() => {
    if (loading) {
      return (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      );
    }
    if (sermons.length === 0) {
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
            <Icon sx={{ fontSize: 36, color: tc.primary }}>play_circle</Icon>
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
            No sermons yet
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
            Check back soon for the latest messages.
          </Typography>
        </Box>
      );
    }
    return sermons.map((sermon) => (
      <SermonCard key={sermon.id} sermon={sermon} onClick={() => handleSermonClick(sermon)} />
    ));
  }, [loading, sermons, tc]);

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: 2 }}>
        Recent Sermons
      </Typography>
      {content}
    </Box>
  );
};
