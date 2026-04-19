"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  CircularProgress,
  Icon,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { ChurchInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config?: ConfigurationInterface;
}

const RECENT_CHURCHES_STORAGE_KEY = "b1app-recent-churches";
const MAX_RECENT_CHURCHES = 5;

const getChurchImage = (church: ChurchInterface): string | undefined => {
  const settings = (church as any).settings as Array<{ keyName?: string; value?: string }> | undefined;
  if (!settings || settings.length === 0) return undefined;
  const preferred = ["favicon_400x400", "logoDark", "logoLight"];
  for (const key of preferred) {
    const match = settings.find((s) => s.keyName === key && s.value && s.value.trim() !== "");
    if (match?.value) return match.value;
  }
  const first = settings.find((s) => s.value && s.value.trim() !== "");
  return first?.value;
};

const readRecentChurches = (): ChurchInterface[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_CHURCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeRecentChurches = (churches: ChurchInterface[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_CHURCHES_STORAGE_KEY, JSON.stringify(churches));
  } catch {
    /* ignore quota / private-mode failures */
  }
};

export const ChurchSearchPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [recentChurches, setRecentChurches] = useState<ChurchInterface[]>([]);

  // Hydrate recent churches from localStorage once on mount.
  useEffect(() => {
    setRecentChurches(readRecentChurches());
  }, []);

  const trimmedSearch = searchText.trim();

  const { data: results = [], isFetching: loading } = useQuery<ChurchInterface[]>({
    queryKey: ["church-search", trimmedSearch],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous(
        `/churches/search/?name=${encodeURIComponent(trimmedSearch)}&app=B1&include=favicon_400x400`,
        "MembershipApi"
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: trimmedSearch.length >= 3,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const hasSearched = trimmedSearch.length >= 3 && !loading;

  const addRecentChurch = useCallback((church: ChurchInterface) => {
    setRecentChurches((prev) => {
      const filtered = prev.filter((c) => c.id !== church.id);
      const next = [church, ...filtered].slice(0, MAX_RECENT_CHURCHES);
      writeRecentChurches(next);
      return next;
    });
  }, []);

  const handleSelect = async (church: ChurchInterface) => {
    if (!church?.id || selecting) return;
    setSelecting(true);
    try {
      addRecentChurch(church);
      const subDomain = (church as any).subDomain;
      if (subDomain && typeof window !== "undefined") {
        // Navigate by subdomain (B1App is subdomain-based).
        const host = window.location.host;
        const parts = host.split(".");
        if (parts.length > 2) parts[0] = subDomain;
        else parts.unshift(subDomain);
        window.location.href = `${window.location.protocol}//${parts.join(".")}/mobile/dashboard`;
      } else {
        router.push("/mobile/dashboard");
      }
    } catch (err) {
      console.error("Church selection error", err);
      setSelecting(false);
    }
  };

  const showingRecents = trimmedSearch.length < 3;
  const displayedChurches = useMemo(
    () => (showingRecents ? recentChurches : results),
    [showingRecents, recentChurches, results]
  );

  const renderChurchRow = (church: ChurchInterface) => {
    const image = getChurchImage(church);
    return (
      <Box
        key={church.id || church.name}
        role="button"
        tabIndex={0}
        onClick={() => handleSelect(church)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect(church);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${mobileTheme.spacing.md}px`,
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          px: `${mobileTheme.spacing.md}px`,
          py: "12px",
          cursor: selecting ? "wait" : "pointer",
          opacity: selecting ? 0.6 : 1,
          transition: "box-shadow 150ms ease, transform 150ms ease",
          "&:hover": { boxShadow: mobileTheme.shadows.md },
          "&:active": { transform: "scale(0.995)" },
        }}
      >
        <Avatar
          src={image}
          sx={{
            width: 48,
            height: 48,
            bgcolor: tc.iconBackground,
            color: tc.primary,
            fontWeight: 700,
          }}
        >
          {(church.name || "?").charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: tc.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {church.name}
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: tc.textSecondary,
              mt: "2px",
            }}
          >
            {selecting ? "Connecting" : "Tap to connect"}
          </Typography>
        </Box>
        {selecting ? (
          <CircularProgress size={18} sx={{ color: tc.primary }} />
        ) : (
          <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {/* Full-screen "Connecting..." overlay */}
      {selecting && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.55)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1500,
          }}
          role="status"
          aria-live="polite"
        >
          <CircularProgress size={48} sx={{ color: tc.onPrimary }} />
          <Typography
            sx={{
              mt: `${mobileTheme.spacing.md}px`,
              color: tc.onPrimary,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Connecting to church...
          </Typography>
        </Box>
      )}

      {/* Hero */}
      <Box
        sx={{
          borderRadius: `${mobileTheme.radius.xl}px`,
          boxShadow: mobileTheme.shadows.lg,
          p: `${mobileTheme.spacing.lg}px`,
          background: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
          color: tc.onPrimary,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "32px",
            bgcolor: "rgba(255,255,255,0.15)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: `${mobileTheme.spacing.md}px`,
          }}
        >
          <Icon sx={{ fontSize: 36, color: tc.onPrimary }}>church</Icon>
        </Box>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: tc.onPrimary, mb: "4px" }}>
          Find Your Church
        </Typography>
        <Typography sx={{ fontSize: 14, color: tc.onPrimary, opacity: 0.9 }}>
          Connect with your community and stay engaged.
        </Typography>
      </Box>

      {/* Search input */}
      <TextField
        placeholder="Search by church name or zip..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        variant="outlined"
        size="medium"
        fullWidth
        sx={{
          mt: `${mobileTheme.spacing.md}px`,
          "& .MuiOutlinedInput-root": {
            borderRadius: `${mobileTheme.radius.md}px`,
            bgcolor: tc.surface,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Icon sx={{ color: tc.textSecondary }}>search</Icon>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading && <CircularProgress size={18} sx={{ color: tc.primary, mr: searchText ? "4px" : 0 }} />}
              {searchText && (
                <IconButton
                  aria-label="Clear search"
                  onClick={() => setSearchText("")}
                  edge="end"
                  size="small"
                  sx={{ color: tc.textSecondary }}
                >
                  <Icon>cancel</Icon>
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
      />

      {/* Results area */}
      <Box sx={{ mt: `${mobileTheme.spacing.md}px`, display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {/* Section heading */}
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 700,
            color: tc.text,
            mb: "4px",
          }}
        >
          {showingRecents ? "Recent churches" : "Search results"}
        </Typography>

        {/* Empty state: recents */}
        {showingRecents && recentChurches.length === 0 && (
          <Box
            sx={{
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              boxShadow: mobileTheme.shadows.sm,
              p: `${mobileTheme.spacing.lg}px`,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "28px",
                bgcolor: tc.iconBackground,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: `${mobileTheme.spacing.sm}px`,
              }}
            >
              <Icon sx={{ fontSize: 28, color: tc.primary }}>travel_explore</Icon>
            </Box>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: "4px" }}>
              Start your search
            </Typography>
            <Typography sx={{ fontSize: 13, color: tc.textMuted }}>
              Search above to find your church.
            </Typography>
          </Box>
        )}

        {/* Empty state: no search results */}
        {!showingRecents && hasSearched && results.length === 0 && (
          <Box
            sx={{
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              boxShadow: mobileTheme.shadows.sm,
              p: `${mobileTheme.spacing.lg}px`,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: 15, color: tc.textMuted }}>
              No churches found. Try a different search term.
            </Typography>
          </Box>
        )}

        {/* Church rows */}
        {displayedChurches.map(renderChurchRow)}
      </Box>
    </Box>
  );
};
