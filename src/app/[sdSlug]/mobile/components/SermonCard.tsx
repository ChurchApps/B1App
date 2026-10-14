"use client";

import React from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { SermonInterface } from "@churchapps/helpers";
import { mobileTheme } from "./mobileTheme";
import { Row, Thumb, hideBrokenImage } from "./kit";
import { formatDate, formatDuration } from "./util";

const tc = mobileTheme.colors;

export const useChurchSermons = (churchId?: string) => useQuery<SermonInterface[]>({
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
  gcTime: 15 * 60 * 1000
});

export const sermonHref = (sermon: SermonInterface, params?: Record<string, string | undefined>) => {
  const qs = new URLSearchParams();
  Object.entries(params || { title: sermon.title }).forEach(([k, v]) => { if (v) qs.set(k, v); });
  const s = qs.toString();
  return `/mobile/sermons/${sermon.id}${s ? `?${s}` : ""}`;
};

export const sermonMeta = (sermon: SermonInterface) =>
  [formatDate(sermon.publishDate, "short"), formatDuration(sermon.duration)].filter(Boolean).join(" · ");

export const SermonRow = ({ sermon, href, leading, trailing }: { sermon: SermonInterface; href: string; leading?: React.ReactNode; trailing?: React.ReactNode }) => (
  <Row
    href={href}
    leading={leading ?? <Thumb src={sermon.thumbnail?.trim() || undefined} />}
    title={sermon.title || Locale.label("mobile.components.untitledSermon")}
    subtitle={sermonMeta(sermon) || undefined}
    trailing={trailing}
  />
);

// 16:9 media plate: the artwork when there is one, otherwise a primaryDeep title card. No scrims.
export const MediaFrame = ({ src, kicker, title, play, href, onClick, ariaLabel, children }: {
  src?: string | null;
  kicker?: React.ReactNode;
  title?: React.ReactNode;
  play?: boolean;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  children?: React.ReactNode;
}) => {
  const image = src?.trim();
  const interactive = !!(href || onClick);
  const body = children ?? (
    <>
      {image
        ? <Box component="img" src={image} alt="" onError={hideBrokenImage} sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        : (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "4px", p: "16px 18px", pr: play ? "76px" : "18px" }}>
            {kicker && <Box component="span" sx={{ fontSize: 11, lineHeight: "16px", fontWeight: 650, letterSpacing: "0.09em", textTransform: "uppercase", opacity: 0.8 }}>{kicker}</Box>}
            {title && <Box component="span" sx={{ fontSize: 22, lineHeight: "27px", fontWeight: 650, letterSpacing: "-0.01em", overflowWrap: "anywhere" }}>{title}</Box>}
          </Box>
        )}
      {play && (
        <Box component="span" sx={{ position: "absolute", right: 14, bottom: 14, width: 48, height: 48, borderRadius: "50%", bgcolor: "#fff", color: tc.primaryDeep, display: "grid", placeItems: "center" }}>
          <PlayArrowIcon />
        </Box>
      )}
    </>
  );
  const sx = {
    position: "relative",
    display: "block",
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: "10px",
    overflow: "hidden",
    bgcolor: tc.primaryDeep,
    color: "#fff",
    textDecoration: "none",
    border: 0,
    p: 0,
    font: "inherit",
    textAlign: "left",
    cursor: interactive ? "pointer" : "default",
    "&:focus-visible": { outline: `2px solid ${tc.primary}`, outlineOffset: 2 }
  } as const;
  if (href) return <Box component={Link} href={href} aria-label={ariaLabel} sx={sx}>{body}</Box>;
  if (onClick) return <Box component="button" type="button" onClick={onClick} aria-label={ariaLabel} sx={sx}>{body}</Box>;
  return <Box sx={sx}>{body}</Box>;
};
