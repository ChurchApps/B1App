"use client";

import React, { useContext } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Icon,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Typography
} from "@mui/material";
import { ApiHelper, Locale, PersonHelper } from "@churchapps/apphelper";
import { getInitials } from "../util";
import { useQuery } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config?: ConfigurationInterface;
}

interface PeopleSection {
  title: string;
  people: PersonInterface[];
}

export const CommunityPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;
  const [searchText, setSearchText] = React.useState("");

  if (!loggedIn) {

    const returnUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";
    const loginHref = returnUrl ? `/mobile/login?returnUrl=${returnUrl}` : "/mobile/login";
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.xl}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center"
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "32px",
              bgcolor: tc.iconBackground,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mb: `${mobileTheme.spacing.md}px`
            }}
          >
            <Icon sx={{ fontSize: 32, color: tc.primary }}>lock</Icon>
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
            Sign In Required
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.md}px` }}>
            The member directory is available to signed-in members of your church.
          </Typography>
          <Button
            variant="contained"
            onClick={() => { window.location.href = loginHref; }}
            sx={{
              bgcolor: tc.primary,
              color: tc.onPrimary,
              textTransform: "none",
              fontWeight: 500,
              borderRadius: `${mobileTheme.radius.md}px`,
              "&:hover": { bgcolor: tc.primary }
            }}
          >
            Sign In
          </Button>
        </Box>
      </Box>
    );
  }

  const { data: serverPeople = null, isFetching } = useQuery<PersonInterface[]>({
    queryKey: ["/people", "MembershipApi"],
    queryFn: async () => {
      const data = await ApiHelper.get("/people", "MembershipApi");
      const list = Array.isArray(data) ? (data as PersonInterface[]) : [];
      return Array.from(new Map(list.map((p) => [p.id, p])).values());
    },
    enabled: loggedIn,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const people = loggedIn ? (isFetching && !serverPeople ? null : (serverPeople ?? null)) : [];

  const filteredPeople = React.useMemo<PersonInterface[] | null>(() => {
    if (people === null) return null;
    if (!searchText.trim()) return people;
    const needle = searchText.toLowerCase();
    return people.filter((p) => {
      const display = p.name?.display || `${p.name?.first || ""} ${p.name?.last || ""}`.trim();
      return display.toLowerCase().includes(needle);
    });
  }, [people, searchText]);

  const sections = React.useMemo<PeopleSection[]>(() => {
    if (!filteredPeople || filteredPeople.length === 0) return [];
    const groups: { [key: string]: PersonInterface[] } = {};

    filteredPeople.forEach((p) => {
      const lastRaw = (p.name?.last || "").trim();
      const firstRaw = (p.name?.first || "").trim();
      const displayRaw = (p.name?.display || "").trim();

      let letter = "Other";
      if (lastRaw) {
        letter = lastRaw.charAt(0).toUpperCase();
      } else if (displayRaw) {

        const parts = displayRaw.split(" ");
        const fallback = parts.length > 1 ? parts[parts.length - 1] : parts[0];
        if (fallback) letter = fallback.charAt(0).toUpperCase();
      } else if (firstRaw) {
        letter = firstRaw.charAt(0).toUpperCase();
      }

      if (!/^[A-Z]$/.test(letter)) letter = "Other";

      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(p);
    });

    Object.keys(groups).forEach((letter) => {
      groups[letter].sort((a, b) => {
        const aLast = (a.name?.last || "").toLowerCase();
        const bLast = (b.name?.last || "").toLowerCase();
        if (aLast !== bLast) return aLast.localeCompare(bLast);
        const aFirst = (a.name?.first || "").toLowerCase();
        const bFirst = (b.name?.first || "").toLowerCase();
        return aFirst.localeCompare(bFirst);
      });
    });

    const letters = Object.keys(groups).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });

    return letters.map((letter) => ({ title: letter, people: groups[letter] }));
  }, [filteredPeople]);

  const getPhoto = (p: PersonInterface): string => {
    try {
      return PersonHelper.getPhotoUrl(p) || "";
    } catch {
      return (p as any).photo || "";
    }
  };

  const handleCardClick = (p: PersonInterface) => {
    router.push(`/mobile/community/${p.id}`);
  };

  const renderAvatar = (p: PersonInterface) => {
    const photo = getPhoto(p);
    const common = {
      width: 48,
      height: 48,
      borderRadius: "24px",
      flexShrink: 0,
      overflow: "hidden",
      mr: "16px"
    } as const;
    if (photo) {
      return (
        <Box
          component="img"
          src={photo}
          alt={p.name?.display || "Member"}
          sx={{ ...common, objectFit: "cover" }}
        />
      );
    }
    return (
      <Box
        sx={{
          ...common,
          bgcolor: tc.primaryLight,
          color: tc.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 16
        }}
      >
        {getInitials(p)}
      </Box>
    );
  };

  const renderCard = (p: PersonInterface) => {
    const first = p.name?.first || "";
    const last = p.name?.last || "";

    return (
      <Box
        key={p.id}
        onClick={() => handleCardClick(p)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick(p);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: tc.surface,
          borderRadius: "12px",
          boxShadow: mobileTheme.shadows.sm,
          px: "16px",
          py: "12px",
          cursor: "pointer",
          transition: "box-shadow 150ms ease, transform 150ms ease",
          "&:hover": { boxShadow: mobileTheme.shadows.md },
          "&:active": { transform: "scale(0.995)" }
        }}
      >
        {renderAvatar(p)}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline" }}>
            <Typography
              component="span"
              sx={{ fontSize: 16, fontWeight: 600, color: tc.text, lineHeight: 1.3, mr: last ? "4px" : 0 }}
            >
              {first}
            </Typography>
            {last && (
              <Typography
                component="span"
                sx={{ fontSize: 16, fontWeight: 800, color: tc.text, lineHeight: 1.3 }}
              >
                {last}
              </Typography>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "18px",
            bgcolor: tc.iconBackground,
            color: tc.textSecondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Icon sx={{ fontSize: 20 }}>chevron_right</Icon>
        </Box>
      </Box>
    );
  };

  const renderSectionHeader = (title: string, isFirst: boolean) => (
    <Box
      sx={{
        mt: isFirst ? 0 : "24px",
        mb: "12px",
        display: "flex",
        alignItems: "center"
      }}
    >
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 700,
          color: tc.primary,
          minWidth: 32
        }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1, height: "1px", bgcolor: tc.border, ml: "16px" }} />
    </Box>
  );

  const renderSkeleton = (key: number) => (
    <Box
      key={`skeleton-${key}`}
      sx={{
        display: "flex",
        alignItems: "center",
        bgcolor: tc.surface,
        borderRadius: "12px",
        boxShadow: mobileTheme.shadows.sm,
        px: "16px",
        py: "12px",
        mb: "8px"
      }}
    >
      <Skeleton variant="circular" width={48} height={48} sx={{ mr: "16px" }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" height={18} />
        <Skeleton variant="text" width="30%" height={14} />
      </Box>
    </Box>
  );

  const renderEmpty = () => (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: `${mobileTheme.spacing.lg}px`,
        py: `${mobileTheme.spacing.xl}px`,
        textAlign: "center"
      }}
    >
      <Icon sx={{ fontSize: 64, color: tc.textSecondary }}>people_outline</Icon>
      <Typography
        sx={{
          fontSize: 22,
          fontWeight: 600,
          color: tc.text,
          mt: `${mobileTheme.spacing.md}px`,
          mb: `${mobileTheme.spacing.xs}px`
        }}
      >
        {searchText ? "No members found" : "Directory"}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textSecondary, lineHeight: "20px" }}>
        {searchText ? "Try adjusting your search." : "Search for members in your church."}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          bgcolor: tc.surface,
          borderBottom: `1px solid ${tc.border}`,
          px: "16px",
          py: "16px"
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          label={Locale.label("mobile.screens.searchMembers")}
          placeholder={Locale.label("mobile.screens.enterName")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon sx={{ color: tc.textSecondary, fontSize: 20 }}>search</Icon>
              </InputAdornment>
            ),
            endAdornment: searchText ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchText("")} aria-label={Locale.label("mobile.screens.clear")}>
                  <Icon sx={{ fontSize: 18 }}>close</Icon>
                </IconButton>
              </InputAdornment>
            ) : undefined,
            sx: {
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.md}px`
            }
          }}
        />
      </Box>

      {filteredPeople === null && (
        <Box sx={{ p: "16px" }}>
          {[0, 1, 2, 3].map(renderSkeleton)}
        </Box>
      )}
      {filteredPeople !== null && sections.length === 0 && renderEmpty()}
      {filteredPeople !== null && sections.length > 0 && (
        <Box sx={{ p: "16px", pb: "32px" }}>
          {sections.map((section, idx) => (
            <Box key={section.title}>
              {renderSectionHeader(section.title, idx === 0)}
              <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {section.people.map(renderCard)}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
