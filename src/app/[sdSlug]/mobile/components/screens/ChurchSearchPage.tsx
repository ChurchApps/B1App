"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  CircularProgress,
  Icon,
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

const getLocation = (church: ChurchInterface): string => {
  const ci: any = (church as any).address || (church as any).contactInfo || {};
  const parts = [ci.city, ci.state].filter(Boolean);
  return parts.join(", ");
};

export const ChurchSearchPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const term = searchText.trim();
    if (term.length < 3) {
      setDebouncedSearch("");
      return;
    }
    const handle = setTimeout(() => setDebouncedSearch(term), 300);
    return () => clearTimeout(handle);
  }, [searchText]);

  const { data: results = [], isFetching: loading } = useQuery<ChurchInterface[]>({
    queryKey: ["church-search", debouncedSearch],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous(
        `/churches/search/?name=${encodeURIComponent(debouncedSearch)}&app=B1&include=favicon_400x400`,
        "MembershipApi"
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: debouncedSearch.length >= 3,
  });

  const hasSearched = debouncedSearch.length >= 3 && !loading;

  const handleSelect = async (church: ChurchInterface) => {
    if (!church?.id || selecting) return;
    setSelecting(true);
    try {
      // TODO: verify - B1App currently relies on subdomain routing; this endpoint mirrors
      // the B1Mobile selectChurch store, but the web equivalent may simply navigate by subdomain.
      try {
        await ApiHelper.post("/churches/select", { id: church.id }, "MembershipApi");
      } catch {
        // non-fatal — fall through to navigation
      }
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

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
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
          endAdornment: loading ? (
            <InputAdornment position="end">
              <CircularProgress size={18} sx={{ color: tc.primary }} />
            </InputAdornment>
          ) : null,
        }}
      />

      {/* Results area */}
      <Box sx={{ mt: `${mobileTheme.spacing.md}px`, display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {searchText.trim().length < 3 && (
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
              Type at least 3 characters to find a church.
            </Typography>
          </Box>
        )}

        {searchText.trim().length >= 3 && !loading && hasSearched && results.length === 0 && (
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

        {results.map((church) => {
          const image = getChurchImage(church);
          const location = getLocation(church);
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
                {location && (
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: tc.textSecondary,
                      mt: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {location}
                  </Typography>
                )}
              </Box>
              <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
