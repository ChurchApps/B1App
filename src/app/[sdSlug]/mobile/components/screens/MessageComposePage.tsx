"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Icon,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { ApiHelper, PersonHelper, UserHelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

export const MessageComposePage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const [searchText, setSearchText] = React.useState("");
  const [results, setResults] = React.useState<PersonInterface[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [previous, setPrevious] = React.useState<PersonInterface[] | null>(null);
  const [lastSearched, setLastSearched] = React.useState("");

  React.useEffect(() => {
    if (!UserHelper.user?.firstName) {
      setPrevious([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const pms: any[] = await ApiHelper.get("/privateMessages", "MessagingApi");
        if (!Array.isArray(pms) || pms.length === 0) {
          if (!cancelled) setPrevious([]);
          return;
        }
        const myPersonId = UserHelper.person?.id;
        const ids = Array.from(
          new Set(
            pms
              .map((pm) =>
                myPersonId && pm.fromPersonId === myPersonId ? pm.toPersonId : pm.fromPersonId
              )
              .filter(Boolean)
          )
        );
        if (ids.length === 0) {
          if (!cancelled) setPrevious([]);
          return;
        }
        const people: PersonInterface[] = await ApiHelper.get(
          `/people/basic?ids=${ids.join(",")}`,
          "MembershipApi"
        );
        if (!cancelled) setPrevious(Array.isArray(people) ? people : []);
      } catch {
        if (!cancelled) setPrevious([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = async () => {
    const term = searchText.trim();
    if (!term) return;
    setLoading(true);
    setLastSearched(term);
    try {
      const data: PersonInterface[] = await ApiHelper.get(
        `/people/search/?term=${encodeURIComponent(term)}`,
        "MembershipApi"
      );
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (p?: PersonInterface | null) => {
    if (!p) return "?";
    const f = (p.name?.first || "").trim().charAt(0).toUpperCase();
    const l = (p.name?.last || "").trim().charAt(0).toUpperCase();
    return (f + l).trim() || (p.name?.display || "?").charAt(0).toUpperCase();
  };

  const getPhoto = (p: PersonInterface) => {
    try {
      return PersonHelper.getPhotoUrl(p) || "";
    } catch {
      return (p as any).photo || "";
    }
  };

  const selectPerson = (p: PersonInterface) => {
    if (!p.id) return;
    router.push(`/mobile/messages/${p.id}`);
  };

  const renderRow = (p: PersonInterface) => {
    const photo = getPhoto(p);
    return (
      <Box
        key={p.id}
        role="button"
        tabIndex={0}
        onClick={() => selectPerson(p)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectPerson(p);
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
          cursor: "pointer",
          "&:hover": { boxShadow: mobileTheme.shadows.md },
        }}
      >
        {photo ? (
          <Box
            component="img"
            src={photo}
            alt={p.name?.display || "Person"}
            sx={{ width: 44, height: 44, borderRadius: "22px", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "22px",
              bgcolor: tc.primaryLight,
              color: tc.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {getInitials(p)}
          </Box>
        )}
        <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 600, color: tc.text }}>
          {p.name?.display || "Unknown"}
        </Typography>
        <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>
      </Box>
    );
  };

  const displayed = searchText.trim() === "" ? previous || [] : results;

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${mobileTheme.spacing.sm}px`,
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <IconButton aria-label="Back" onClick={() => router.back()} sx={{ color: tc.text }}>
          <Icon>arrow_back</Icon>
        </IconButton>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text }}>New Message</Typography>
      </Box>

      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 1 }}>
          Search for a person
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Name"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon>person</Icon>
              </InputAdornment>
            ),
          }}
          sx={{ mb: `${mobileTheme.spacing.sm}px` }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading || !searchText.trim()}
          fullWidth
          sx={{
            bgcolor: tc.primary,
            color: tc.onPrimary,
            textTransform: "none",
            fontWeight: 600,
            borderRadius: `${mobileTheme.radius.md}px`,
            "&:hover": { bgcolor: tc.primary },
          }}
        >
          {loading ? "Searching…" : "Search"}
        </Button>
      </Box>

      {searchText.trim() === "" && previous !== null && previous.length > 0 && (
        <Typography sx={{ fontSize: 13, color: tc.textSecondary, mb: "8px", fontWeight: 500 }}>
          Recent conversations
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {previous === null && searchText.trim() === "" && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress sx={{ color: tc.primary }} size={28} />
          </Box>
        )}
        {displayed.map(renderRow)}
        {searchText.trim() !== "" && !loading && results.length === 0 && searchText === lastSearched && (
          <Typography sx={{ textAlign: "center", color: tc.textMuted, mt: 2 }}>
            No matches found.
          </Typography>
        )}
        {searchText.trim() === "" && previous !== null && previous.length === 0 && (
          <Typography sx={{ textAlign: "center", color: tc.textMuted, mt: 2 }}>
            Search for a person to start a conversation.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MessageComposePage;
