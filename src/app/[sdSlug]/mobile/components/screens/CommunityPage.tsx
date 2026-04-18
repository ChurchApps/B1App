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
import type { PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config?: ConfigurationInterface;
}

export const CommunityPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const [searchText, setSearchText] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [people, setPeople] = React.useState<PersonInterface[] | null>(null);

  // Debounce input 300ms
  React.useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchText]);

  React.useEffect(() => {
    if (!UserHelper.user?.firstName) {
      setPeople([]);
      return;
    }
    let cancelled = false;
    setPeople(null);

    // Endpoints match /my/[pageSlug]/components/DirectoryMasterPanel.tsx
    const term = encodeURIComponent(debouncedSearch);
    const url = debouncedSearch
      ? `/people/search?term=${term}`
      : "/people/directory/all";

    ApiHelper.get(url, "MembershipApi")
      .then((data: PersonInterface[]) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        // De-dupe by id
        const unique = list.filter(
          (p, idx, self) => self.findIndex((x) => x.id === p.id) === idx
        );
        // Sort by last, then first
        unique.sort((a, b) => {
          const aLast = (a.name?.last || "").toLowerCase();
          const bLast = (b.name?.last || "").toLowerCase();
          if (aLast !== bLast) return aLast.localeCompare(bLast);
          const aFirst = (a.name?.first || "").toLowerCase();
          const bFirst = (b.name?.first || "").toLowerCase();
          return aFirst.localeCompare(bFirst);
        });
        setPeople(unique);
      })
      .catch(() => {
        if (!cancelled) setPeople([]);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

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
        {debouncedSearch ? "No members found" : "Directory"}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        {debouncedSearch ? "Try a different name." : "Search for members in your church."}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.md}px` }}>
        Community
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
        {people === null && [0, 1, 2, 3].map(renderSkeleton)}
        {people !== null && people.length === 0 && renderEmpty()}
        {people !== null && people.length > 0 && people.map(renderCard)}
      </Box>
    </Box>
  );
};
