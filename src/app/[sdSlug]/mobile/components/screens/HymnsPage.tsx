"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Chip, CircularProgress, Icon, IconButton, InputAdornment, MenuItem, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { hymnRepository } from "@/features/hymns/hymnRepository";
import { useHymnFavorites } from "@/features/hymns/favorites";
import type { Hymn, HymnLanguage } from "@/features/hymns/types";
import { mobileTheme } from "../mobileTheme";

const matchesQuery = (hymn: Hymn, query: string): boolean => {
  if (!query) return true;
  const searchable = [
    hymn.hymnNumber.toString(),
    hymn.title,
    hymn.lyrics,
    hymn.chorus,
    ...(hymn.verses ?? []).flatMap((verse) => [verse.label, verse.text]),
    hymn.englishLyrics,
    hymn.yorubaLyrics,
    hymn.author,
    hymn.category,
    hymn.collection,
    hymn.denomination,
    ...(hymn.tags ?? [])
  ].filter(Boolean).join(" ").toLocaleLowerCase();
  return searchable.includes(query.toLocaleLowerCase());
};

interface Props {
  churchId?: string;
}

export const HymnsPage = ({ churchId }: Props) => {
  const tc = mobileTheme.colors;
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<"all" | HymnLanguage>("all");
  const [category, setCategory] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { favoriteIds, toggleFavorite } = useHymnFavorites();

  useEffect(() => {
    let active = true;
    hymnRepository.list({ churchId, publicationState: "published" })
      .then((items) => { if (active) setHymns(items); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [churchId]);

  const categories = useMemo(() => [...new Set(hymns.map((hymn) => hymn.category))].sort(), [hymns]);
  const filteredHymns = useMemo(() => hymns.filter((hymn) => (
    matchesQuery(hymn, query)
    && (language === "all" || hymn.language === language)
    && (category === "all" || hymn.category === category)
    && (!favoritesOnly || favoriteIds.includes(hymn.id))
  )), [category, favoriteIds, favoritesOnly, hymns, language, query]);

  if (loading) {
    return <Box sx={{ minHeight: 280, display: "grid", placeItems: "center", bgcolor: tc.background }}><CircularProgress sx={{ color: tc.primary }} /></Box>;
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center", bgcolor: tc.background, minHeight: "100%" }}>
        <Icon sx={{ fontSize: 52, color: tc.error }}>error_outline</Icon>
        <Typography sx={{ fontSize: 19, fontWeight: 700, color: tc.text, mt: 1 }}>Hymns are unavailable</Typography>
        <Typography sx={{ color: tc.textSecondary, mt: 0.5 }}>Please try again shortly.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography component="h1" sx={{ fontFamily: mobileTheme.fonts.serif, fontSize: 28, fontWeight: 700, color: tc.text, mb: 0.5 }}>Hymns</Typography>
      <Typography sx={{ fontSize: 14, color: tc.textSecondary, mb: 2.5 }}>Browse the church hymnal</Typography>
      <TextField
        fullWidth size="small" value={query} onChange={(event) => setQuery(event.target.value)}
        placeholder="Search number, title, lyrics, author…" inputProps={{ "aria-label": "Search hymns" }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: tc.textSecondary }} /></InputAdornment> } }}
        sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.md}px`, color: tc.text } }}
      />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 1, mb: 2 }}>
        <TextField select size="small" label="Language" value={language} onChange={(event) => setLanguage(event.target.value as "all" | HymnLanguage)}>
          <MenuItem value="all">All languages</MenuItem><MenuItem value="English">English</MenuItem><MenuItem value="Yoruba">Yoruba</MenuItem><MenuItem value="Bilingual">Bilingual</MenuItem>
        </TextField>
        <TextField select size="small" label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>
          <MenuItem value="all">All categories</MenuItem>{categories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        <Chip label="Favorites" icon={<Icon>bookmark</Icon>} onClick={() => setFavoritesOnly((value) => !value)} color={favoritesOnly ? "primary" : "default"} variant={favoritesOnly ? "filled" : "outlined"} sx={{ alignSelf: "center", justifySelf: { xs: "start", sm: "stretch" } }} />
      </Box>
      <Typography sx={{ fontSize: 12, color: tc.textMuted, mb: 1 }}>{filteredHymns.length} hymn{filteredHymns.length === 1 ? "" : "s"}</Typography>
      {filteredHymns.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center", bgcolor: tc.surface, border: `1px solid ${tc.border}`, borderRadius: `${mobileTheme.radius.lg}px` }}>
          <Icon sx={{ fontSize: 44, color: tc.textSecondary }}>search_off</Icon>
          <Typography sx={{ color: tc.text, fontWeight: 700, mt: 1 }}>No hymns found</Typography>
          <Typography sx={{ color: tc.textSecondary, fontSize: 14, mt: 0.5 }}>Try a different search or filter.</Typography>
        </Box>
      ) : filteredHymns.map((hymn) => {
        const favorite = favoriteIds.includes(hymn.id);
        return (
          <Box key={hymn.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, mb: 1, bgcolor: tc.surface, border: `1px solid ${tc.border}`, borderRadius: `${mobileTheme.radius.md}px` }}>
            <Link href={`/mobile/hymns/${hymn.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                <Box sx={{ width: 38, height: 38, borderRadius: "50%", bgcolor: tc.iconBackground, color: tc.primary, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{hymn.hymnNumber}</Box>
                <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ color: tc.text, fontWeight: 700 }}>{hymn.title}</Typography><Typography sx={{ color: tc.textSecondary, fontSize: 12 }}>{hymn.language} · {hymn.category}</Typography></Box>
              </Box>
            </Link>
            <IconButton onClick={() => toggleFavorite(hymn.id)} aria-label={favorite ? `Remove ${hymn.title} from favorites` : `Add ${hymn.title} to favorites`} sx={{ color: favorite ? tc.primary : tc.textSecondary }}><Icon>{favorite ? "bookmark" : "bookmark_border"}</Icon></IconButton>
          </Box>
        );
      })}
    </Box>
  );
};
