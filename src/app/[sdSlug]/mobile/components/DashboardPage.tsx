"use client";

import React, { useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Typography } from "@mui/material";
import { type LinkInterface } from "@churchapps/helpers";
import { Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, linkTypeToIcon, linkTypeToRoute, linkTypeToTagline } from "./mobileTheme";
import { NotificationPermissionBanner } from "./NotificationPermissionBanner";
import { MobileHeaderActions } from "./MobileAppBar";
import { filterVisibleLinks, useChurchLinks } from "../hooks/useConfig";
import { useEngagementSort } from "../hooks/useEngagementSort";
import { EmptyDashboardPlaceholder } from "./EmptyDashboardPlaceholder";
import { loadDailyVerse, type DailyVerse } from "../helpers/dailyVerses";
import { dashboardBaseLinks, hasVotdLink as checkVotdLink, FEATURED_COUNT, splitExplore } from "../helpers/dashboardLinks";
import { useMobileThemeMode } from "./MobileThemeProvider";

interface Props {
  config: ConfigurationInterface;
}

const ENGAGEMENT_STORAGE_KEY = "b1app-link-view-counts";

const generateLinkId = (item: LinkInterface): string => item.id || `${item.linkType}_${item.text}`;

const resolvePhoto = (item: LinkInterface): string | null => {
  const photo = (item as unknown as { photo?: string }).photo;
  return photo || null;
};

const eyebrowSx = {
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: mobileTheme.colors.textSecondary
};

// Photo when available; brand color-wash when not — never a ghosted placeholder icon.
const MediaCard = ({ link, height, titleSize, chip, onClick, onKeyDown }: {
  link: LinkInterface;
  height: number;
  titleSize: number;
  chip?: string | null;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) => {
  const photo = resolvePhoto(link);
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      sx={{
        position: "relative",
        height,
        borderRadius: `${mobileTheme.radius.lg}px`,
        overflow: "hidden",
        cursor: "pointer",
        flex: 1,
        background: photo ? `url(${photo}) center / cover no-repeat, ${mobileTheme.colorWash}` : mobileTheme.colorWash,
        "&:active": { transform: "scale(0.985)" },
        transition: "transform 120ms ease"
      }}
    >
      {!photo && (
        <Box sx={{
          position: "absolute",
          top: -40,
          right: -20,
          width: height * 1.2,
          height: height * 1.2,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,193,120,0.35), transparent 65%)"
        }} />
      )}
      {chip && (
        <Typography sx={{
          position: "absolute",
          top: 12,
          left: 12,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#FFFFFF",
          bgcolor: "rgba(0,0,0,0.28)",
          px: "10px",
          py: "5px",
          borderRadius: "999px"
        }}>
          {chip}
        </Typography>
      )}
      <Box sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        pt: 5,
        pb: "14px",
        px: "14px",
        background: "linear-gradient(transparent, rgba(7,14,27,0.78))"
      }}>
        <Typography sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: titleSize, lineHeight: 1.2 }}>
          {link.text}
        </Typography>
      </Box>
    </Box>
  );
};

const VerseCard = ({ verse, onClick }: { verse: DailyVerse; onClick: () => void }) => (
  <Box
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    sx={{
      position: "relative",
      overflow: "hidden",
      borderRadius: `${mobileTheme.radius.xl}px`,
      background: mobileTheme.verseGradient,
      color: "#FFFFFF",
      p: "20px",
      pb: "16px",
      mb: 2,
      cursor: "pointer",
      "&::after": {
        content: '""',
        position: "absolute",
        bottom: -70,
        left: -40,
        width: 180,
        height: 180,
        borderRadius: "50%",
        border: "26px solid rgba(255,255,255,0.05)"
      }
    }}
  >
    <Typography sx={{
      fontFamily: mobileTheme.fonts.serif,
      fontStyle: "italic",
      fontSize: 19,
      lineHeight: 1.45,
      mb: "10px",
      position: "relative"
    }}>
      {verse.text}
    </Typography>
    <Typography sx={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.75)"
    }}>
      {verse.reference} · {Locale.label("mobile.components.verseOfTheDay")}
    </Typography>
  </Box>
);

export const DashboardPage = ({ config }: Props) => {
  const context = useContext(UserContext);
  const router = useRouter();
  const tc = mobileTheme.colors;
  const { mode } = useMobileThemeMode();
  const churchId = config?.church?.id;
  const jwt = context?.userChurch?.jwt;

  const [greetingWord, setGreetingWord] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [dateLine, setDateLine] = React.useState("");
  const [verse, setVerse] = React.useState<DailyVerse | null>(null);

  React.useEffect(() => {
    const first = context?.person?.name?.first || context?.user?.firstName || "";
    setFirstName(first);

    const now = new Date();
    setDateLine(now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }));

    const hour = now.getHours();
    if (hour < 12) setGreetingWord(Locale.label("mobile.dashboard.goodMorning"));
    else if (hour < 17) setGreetingWord(Locale.label("mobile.dashboard.goodAfternoon"));
    else setGreetingWord(Locale.label("mobile.dashboard.goodEvening"));
  }, [context?.person, context?.user]);

  const { data: rawLinks, isLoading } = useChurchLinks(churchId, jwt);

  const links = useMemo<LinkInterface[]>(() => {
    const visible = filterVisibleLinks(rawLinks, context?.userChurch);
    return visible.filter((l) => l.linkType !== "separator");
  }, [rawLinks, context?.userChurch]);

  // The verse card is the church's VOTD feature on the dashboard — hidden when the church removed the link.
  const hasVotdLink = useMemo(() => checkVotdLink(links), [links]);

  React.useEffect(() => {
    if (!hasVotdLink) {
      setVerse(null);
      return;
    }
    let cancelled = false;
    loadDailyVerse().then((v) => { if (!cancelled) setVerse(v); });
    return () => { cancelled = true; };
  }, [hasVotdLink]);

  const loading = isLoading && links.length === 0;

  // Hero + featured stay in the church's configured order (stable spatial memory);
  // only the Explore grid adapts to engagement.
  const base = useMemo(() => dashboardBaseLinks(links), [links]);
  const rest = useMemo(() => base.slice(FEATURED_COUNT), [base]);

  const getLinkId = useCallback((link: LinkInterface) => generateLinkId(link), []);
  const { sorted: sortedRest, increment: incrementViewCount } = useEngagementSort(
    rest,
    ENGAGEMENT_STORAGE_KEY,
    getLinkId
  );

  const navigate = (link: LinkInterface) => {
    incrementViewCount(generateLinkId(link));
    const route = linkTypeToRoute(link.linkType, link.linkData, link.text, link.url);
    if (!route) return;
    if (link.linkType === "url" || route.startsWith("http")) {
      const target = route.startsWith("http") ? route : new URL(route, window.location.origin).toString();
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      router.push(route);
    }
  };

  const handleKey = (e: React.KeyboardEvent, link: LinkInterface) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(link);
    }
  };

  const featured = base.slice(0, FEATURED_COUNT);
  const hero = featured[0];
  const featuredTwo = featured.slice(1, FEATURED_COUNT);
  const { explore: others, showMore: showMoreCard } = splitExplore(sortedRest);

  const logoLight = config?.appearance?.logoLight;
  const logoDark = (config?.appearance as any)?.logoDark;
  const headerLogo = mode === "dark" ? (logoLight || logoDark) : (logoDark || logoLight);

  if (loading) {
    return (
      <Box sx={{ px: `${mobileTheme.spacing.md}px`, pt: 3 }}>
        <Box sx={{ bgcolor: tc.surfaceVariant, height: 40, width: "60%", borderRadius: `${mobileTheme.radius.md}px`, mb: 2 }} />
        <Box sx={{ bgcolor: tc.surfaceVariant, height: 130, borderRadius: `${mobileTheme.radius.xl}px`, mb: 2 }} />
        <Box sx={{ bgcolor: tc.surfaceVariant, height: 170, borderRadius: `${mobileTheme.radius.lg}px`, mb: 2 }} />
        <Box sx={{ display: "flex", gap: "12px" }}>
          <Box sx={{ flex: 1, bgcolor: tc.surfaceVariant, height: 110, borderRadius: `${mobileTheme.radius.lg}px` }} />
          <Box sx={{ flex: 1, bgcolor: tc.surfaceVariant, height: 110, borderRadius: `${mobileTheme.radius.lg}px` }} />
        </Box>
      </Box>
    );
  }

  if (links.length === 0) {
    return <EmptyDashboardPlaceholder config={config} />;
  }

  const signedIn = !!(context?.user);

  return (
    <Box sx={{ minHeight: "100%", px: `${mobileTheme.spacing.md}px`, pt: 1.5, pb: 3 }}>
      <NotificationPermissionBanner enabled={!!jwt} />

      <Box component="header" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, minHeight: 40 }}>
        {headerLogo ? (
          <img src={headerLogo} alt={config?.church?.name || ""} style={{ height: 28, width: "auto", maxWidth: "55%", objectFit: "contain" }} />
        ) : (
          <Typography noWrap sx={{ ...eyebrowSx, color: tc.textSecondary, pr: 1 }}>
            {config?.church?.name || ""}
          </Typography>
        )}
        <MobileHeaderActions onAvatarClick={() => router.push("/mobile/profileEdit")} />
      </Box>

      {signedIn && firstName ? (
        <Box sx={{ mb: 2, minHeight: 56 }}>
          {dateLine && <Typography sx={{ ...eyebrowSx, mb: "2px" }}>{dateLine}</Typography>}
          <Typography sx={{ fontFamily: mobileTheme.fonts.serif, fontSize: 30, fontWeight: 600, color: tc.text, lineHeight: 1.1 }}>
            {greetingWord ? `${greetingWord}, ${firstName}` : " "}
          </Typography>
        </Box>
      ) : !signedIn ? (
        <Box sx={{ mb: 2, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            {dateLine && <Typography sx={{ ...eyebrowSx, mb: "2px" }}>{dateLine}</Typography>}
            <Typography sx={{ fontFamily: mobileTheme.fonts.serif, fontSize: 30, fontWeight: 600, color: tc.text, lineHeight: 1.1 }}>
              {Locale.label("mobile.dashboard.welcome")}
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: tc.textSecondary, mt: "4px" }}>
              {Locale.label("mobile.dashboard.signInPrompt")}
            </Typography>
          </Box>
          <Box
            component="a"
            href="/mobile/login?returnUrl=%2Fmobile%2Fdashboard"
            sx={{
              flex: "none",
              px: "18px",
              py: "9px",
              borderRadius: "999px",
              bgcolor: tc.primary,
              color: tc.onPrimary,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            {Locale.label("mobile.components.signIn")}
          </Box>
        </Box>
      ) : null}

      {hasVotdLink && (verse
        ? <VerseCard verse={verse} onClick={() => router.push("/mobile/votd")} />
        : <Box sx={{ height: 132, borderRadius: `${mobileTheme.radius.xl}px`, bgcolor: tc.surfaceVariant, mb: 2 }} />)}

      {hero && (
        <Box sx={{ mb: featuredTwo.length > 0 ? "12px" : 3 }}>
          <MediaCard
            link={hero}
            height={176}
            titleSize={22}
            chip={linkTypeToTagline(hero.linkType)}
            onClick={() => navigate(hero)}
            onKeyDown={(e) => handleKey(e, hero)}
          />
        </Box>
      )}

      {featuredTwo.length > 0 && (
        <Box sx={{ display: "flex", gap: "12px", mb: 3 }}>
          {featuredTwo.map((item) => (
            <MediaCard
              key={generateLinkId(item)}
              link={item}
              height={110}
              titleSize={15}
              onClick={() => navigate(item)}
              onKeyDown={(e) => handleKey(e, item)}
            />
          ))}
        </Box>
      )}

      {(others.length > 0 || showMoreCard) && (
        <Box>
          <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>
            {Locale.label("mobile.components.explore")}
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }, gap: "12px" }}>
            {others.map((item) => {
              const tagline = linkTypeToTagline(item.linkType);
              return (
                <Box
                  key={generateLinkId(item)}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(item)}
                  onKeyDown={(e) => handleKey(e, item)}
                  sx={{
                    bgcolor: tc.surface,
                    border: `1px solid ${tc.border}`,
                    borderRadius: `${mobileTheme.radius.lg}px`,
                    p: "14px",
                    cursor: "pointer",
                    "&:active": { transform: "scale(0.985)" },
                    transition: "transform 120ms ease"
                  }}
                >
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "11px",
                    bgcolor: tc.iconBackground,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: "10px"
                  }}>
                    <Icon sx={{ fontSize: 20, color: tc.primary }}>{linkTypeToIcon(item.linkType, item.icon)}</Icon>
                  </Box>
                  <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 650, color: tc.text }}>
                    {item.text}
                  </Typography>
                  {tagline && (
                    <Typography noWrap sx={{ fontSize: 11.5, color: tc.textSecondary, mt: "1px" }}>
                      {tagline}
                    </Typography>
                  )}
                </Box>
              );
            })}

            {showMoreCard && (
              <Box
                role="button"
                tabIndex={0}
                onClick={() => router.push("/mobile/more")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push("/mobile/more");
                  }
                }}
                sx={{
                  bgcolor: tc.surface,
                  border: `1px solid ${tc.border}`,
                  borderRadius: `${mobileTheme.radius.lg}px`,
                  p: "14px",
                  cursor: "pointer",
                  "&:active": { transform: "scale(0.985)" },
                  transition: "transform 120ms ease"
                }}
              >
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "11px",
                  bgcolor: tc.iconBackground,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: "10px"
                }}>
                  <Icon sx={{ fontSize: 20, color: tc.primary }}>more_horiz</Icon>
                </Box>
                <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 650, color: tc.text }}>
                  {Locale.label("mobile.components.more")}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
