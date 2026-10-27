"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Box, CircularProgress, Icon, IconButton, Typography } from "@mui/material";
import { hymnRepository } from "@/features/hymns/hymnRepository";
import { useHymnFavorites } from "@/features/hymns/favorites";
import type { Hymn } from "@/features/hymns/types";
import { mobileTheme } from "../mobileTheme";

interface Props { id: string; churchId?: string; }

const Metadata = ({ label, value }: { label: string; value?: string | number }) => value ? (
  <Box sx={{ mb: 1.25 }}><Typography sx={{ color: mobileTheme.colors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</Typography><Typography sx={{ color: mobileTheme.colors.text, fontSize: 14, mt: 0.25 }}>{value}</Typography></Box>
) : null;

export const HymnDetail = ({ id, churchId }: Props) => {
  const tc = mobileTheme.colors;
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const { favoriteIds, toggleFavorite } = useHymnFavorites();

  useEffect(() => {
    let active = true;
    hymnRepository.getById(id, { churchId, publicationState: "published" }).then((item) => { if (active) { setHymn(item); } }).catch(() => { if (active) { setError(true); } }).finally(() => { if (active) { setLoading(false); } });
    return () => { active = false; };
  }, [churchId, id]);

  if (loading) {
    return <Box sx={{ minHeight: 280, display: "grid", placeItems: "center", bgcolor: tc.background }}><CircularProgress sx={{ color: tc.primary }} /></Box>;
  }
  if (error || !hymn) {
    return (
      <Box sx={{ p: 3, textAlign: "center", bgcolor: tc.background, minHeight: "100%" }}>
        <Icon sx={{ fontSize: 52, color: tc.textSecondary }}>music_off</Icon><Typography sx={{ color: tc.text, fontWeight: 700, fontSize: 19, mt: 1 }}>Hymn not available</Typography>
        <Link href="/mobile/hymns" style={{ color: tc.primary, fontWeight: 700, display: "inline-block", marginTop: 16 }}>Back to hymns</Link>
      </Box>
    );
  }

  const favorite = favoriteIds.includes(hymn.id);
  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Link href="/mobile/hymns" style={{ color: tc.primary, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>← Back to hymns</Link>
      <Box sx={{ mt: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}><Typography sx={{ color: tc.primary, fontWeight: 800, fontSize: 15, pt: 0.5 }}>#{hymn.hymnNumber}</Typography><Typography component="h1" sx={{ color: tc.text, fontFamily: mobileTheme.fonts.serif, fontWeight: 700, fontSize: 29, lineHeight: 1.15, flex: 1 }}>{hymn.title}</Typography><IconButton onClick={() => toggleFavorite(hymn.id)} aria-label={favorite ? "Remove from favorites" : "Add to favorites"} sx={{ color: favorite ? tc.primary : tc.textSecondary }}><Icon>{favorite ? "bookmark" : "bookmark_border"}</Icon></IconButton></Box>
        <Typography sx={{ color: tc.textSecondary, fontSize: 14, mt: 0.75 }}>{hymn.language} · {hymn.category}</Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end", mb: 1.25 }}>
        <Typography sx={{ color: tc.textSecondary, fontSize: 13 }}>Text size</Typography>
        <IconButton size="small" onClick={() => setFontSize((size) => Math.max(15, size - 1))} aria-label="Decrease lyrics text size"><Icon>text_decrease</Icon></IconButton>
        <IconButton size="small" onClick={() => setFontSize((size) => Math.min(26, size + 1))} aria-label="Increase lyrics text size"><Icon>text_increase</Icon></IconButton>
      </Box>
      <Box sx={{ bgcolor: tc.surface, border: `1px solid ${tc.border}`, borderRadius: `${mobileTheme.radius.lg}px`, p: { xs: 2, sm: 3 }, mb: 2 }}>
        <Typography sx={{ color: tc.text, fontFamily: mobileTheme.fonts.serif, fontSize, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{hymn.lyrics || hymn.verses?.map((verse) => `${verse.label || `Verse ${verse.order}`}\n${verse.text}`).join("\n\n")}</Typography>
        {hymn.chorus && <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${tc.border}` }}><Typography sx={{ color: tc.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5 }}>Chorus</Typography><Typography sx={{ color: tc.text, fontFamily: mobileTheme.fonts.serif, fontSize, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{hymn.chorus}</Typography></Box>}
      </Box>
      <Box sx={{ bgcolor: tc.surface, border: `1px solid ${tc.border}`, borderRadius: `${mobileTheme.radius.lg}px`, p: 2 }}>
        <Typography sx={{ color: tc.text, fontWeight: 700, mb: 1.5 }}>Hymn information</Typography>
        <Metadata label="Author" value={hymn.author} /><Metadata label="Composer" value={hymn.composer} /><Metadata label="Translator" value={hymn.translator} /><Metadata label="Year" value={hymn.year} /><Metadata label="Source" value={hymn.source} /><Metadata label="Copyright status" value={hymn.copyrightStatus.replace("-", " ")} /><Metadata label="License" value={hymn.license} /><Metadata label="Attribution" value={hymn.attribution} />
      </Box>
    </Box>
  );
};
