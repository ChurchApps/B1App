"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Icon,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { ApiHelper, PersonHelper, UserHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config?: ConfigurationInterface;
}

interface PeopleSection {
  title: string;
  people: PersonInterface[];
}

export const CommunityPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const loggedIn = !!UserHelper.user?.firstName;
  const [searchText, setSearchText] = React.useState("");

  // B1Mobile authority fetches the full list once via GET /people and filters locally,
  // so we match that. The full directory is cached 10min/30min for parity.
  const { data: serverPeople = null, isFetching } = useQuery<PersonInterface[]>({
    queryKey: ["/people", "MembershipApi"],
    queryFn: async () => {
      const data = await ApiHelper.get("/people", "MembershipApi");
      const list = Array.isArray(data) ? (data as PersonInterface[]) : [];
      return list.filter((p, idx, self) => self.findIndex((x) => x.id === p.id) === idx);
    },
    enabled: loggedIn,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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

  // Group by first letter of last name, with an "Other" bucket for missing last names.
  // Within each group, sort by last name, then first name. Groups sorted alphabetically
  // with "Other" always pushed to the end.
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
        // Fall back to the last token of display (mirrors B1Mobile behavior when last is missing).
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

  const getInitials = (p: PersonInterface) => {
    const f = (p.name?.first || "").trim().charAt(0).toUpperCase();
    const l = (p.name?.last || "").trim().charAt(0).toUpperCase();
    const initials = `${f}${l}`.trim();
    return initials || (p.name?.display || "?").charAt(0).toUpperCase();
  };

  const getPhoto = (p: PersonInterface): string => {
    try {
      return PersonHelper.getPhotoUrl(p) || "";
    } catch {
      return (p as any).photo || "";
    }
  };

  const getPhone = (p: PersonInterface): string => {
    const ci = (p as any).contactInfo || {};
    return ci.mobilePhone || ci.homePhone || ci.workPhone || "";
  };

  const getEmail = (p: PersonInterface): string => {
    const ci = (p as any).contactInfo || {};
    return ci.email || "";
  };

  const getSubtitle = (p: PersonInterface): string => {
    const ci = (p as any).contactInfo || {};
    return ci.city || (p as any).role || "";
  };

  const handleCardClick = (p: PersonInterface) => {
    router.push(`/mobile/community/${p.id}`);
  };

  const handlePhone = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    window.location.href = `mailto:${email}`;
  };

  const renderAvatar = (p: PersonInterface) => {
    const photo = getPhoto(p);
    const common = {
      width: 40,
      height: 40,
      borderRadius: "20px",
      flexShrink: 0,
      overflow: "hidden",
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
          fontSize: 14,
        }}
      >
        {getInitials(p)}
      </Box>
    );
  };

  const renderCard = (p: PersonInterface) => {
    const phone = getPhone(p);
    const email = getEmail(p);
    const subtitle = getSubtitle(p);
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
          gap: `${mobileTheme.spacing.md}px`,
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          px: `${mobileTheme.spacing.md}px`,
          py: "12px",
          cursor: "pointer",
          transition: "box-shadow 150ms ease, transform 150ms ease",
          "&:hover": { boxShadow: mobileTheme.shadows.md },
          "&:active": { transform: "scale(0.995)" },
        }}
      >
        {renderAvatar(p)}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", gap: "4px", alignItems: "baseline", flexWrap: "wrap" }}>
            <Typography
              component="span"
              sx={{ fontSize: 16, fontWeight: 600, color: tc.text, lineHeight: 1.3 }}
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
          {subtitle && (
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 400,
                color: tc.textSecondary,
                mt: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: `${mobileTheme.spacing.xs}px` }}>
          {phone && (
            <IconButton
              size="small"
              onClick={(e) => handlePhone(e, phone)}
              aria-label="Call"
              sx={{
                width: 36,
                height: 36,
                bgcolor: tc.iconBackground,
                color: tc.primary,
                "&:hover": { bgcolor: tc.iconBackground },
              }}
            >
              <Icon sx={{ fontSize: 18 }}>phone</Icon>
            </IconButton>
          )}
          {email && (
            <IconButton
              size="small"
              onClick={(e) => handleEmail(e, email)}
              aria-label="Email"
              sx={{
                width: 36,
                height: 36,
                bgcolor: tc.iconBackground,
                color: tc.primary,
                "&:hover": { bgcolor: tc.iconBackground },
              }}
            >
              <Icon sx={{ fontSize: 18 }}>email</Icon>
            </IconButton>
          )}
          <Icon sx={{ color: tc.textSecondary, ml: "2px" }}>chevron_right</Icon>
        </Box>
      </Box>
    );
  };

  const renderSectionHeader = (title: string) => (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        bgcolor: tc.background,
        py: "6px",
        mb: `${mobileTheme.spacing.xs}px`,
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
      }}
    >
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 700,
          color: tc.primary,
          minWidth: 32,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1, height: "1px", bgcolor: tc.border }} />
    </Box>
  );

  const renderSkeleton = (key: number) => (
    <Box
      key={`skeleton-${key}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        px: `${mobileTheme.spacing.md}px`,
        py: "12px",
      }}
    >
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" height={18} />
        <Skeleton variant="text" width="30%" height={14} />
      </Box>
    </Box>
  );

  const renderEmpty = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center",
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
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.primary }}>people_outline</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
        {searchText ? "No members found" : "Directory"}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        {searchText ? "Try a different name." : "Search for members in your church."}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.md}px` }}>
        Directory
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Search members..."
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
              <IconButton size="small" onClick={() => setSearchText("")} aria-label="Clear">
                <Icon sx={{ fontSize: 18 }}>close</Icon>
              </IconButton>
            </InputAdornment>
          ) : undefined,
          sx: {
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.md}px`,
            "& fieldset": { borderColor: tc.border },
          },
        }}
        sx={{ mb: `${mobileTheme.spacing.md}px` }}
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {filteredPeople === null && [0, 1, 2, 3].map(renderSkeleton)}
        {filteredPeople !== null && sections.length === 0 && renderEmpty()}
        {filteredPeople !== null &&
          sections.length > 0 &&
          sections.map((section) => (
            <Box key={section.title} sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
              {renderSectionHeader(section.title)}
              {section.people.map(renderCard)}
            </Box>
          ))}
      </Box>
    </Box>
  );
};
