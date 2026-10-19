"use client";

import React, { useContext, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Icon, Typography } from "@mui/material";
import { type LinkInterface, DateHelper } from "@churchapps/helpers";
import { Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, linkTypeToIcon, linkTypeToTagline } from "./mobileTheme";
import { cssUrl } from "./util";
import { NotificationPermissionBanner } from "./NotificationPermissionBanner";
import { ScreenSkeleton } from "./ScreenSkeleton";
import { filterVisibleLinks, useChurchLinks } from "../hooks/useConfig";
import { useEngagementSort } from "../hooks/useEngagementSort";
import { EmptyDashboardPlaceholder } from "./EmptyDashboardPlaceholder";
import { loadDailyVerse, type DailyVerse } from "../helpers/dailyVerses";
import { LINK_VIEW_COUNTS_KEY, linkId, linkTarget, openExternal } from "../helpers/dashboardLinks";

// Pre-#616 b1Tab card home (hero + 2 featured + Explore grid). The teaser home is parked in DashboardPageTeasers.
interface Props {
  config: ConfigurationInterface;
}

const FEATURED_COUNT = 3;
const EXPLORE_SLOTS = 4;

const eyebrowSx = {
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: mobileTheme.colors.onBackground,
  opacity: 0.75
};

const pressable = (onClick: () => void) => ({
  role: "button",
  tabIndex: 0,
  onClick,
  onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }
});

// Photo when available; brand color-wash when not.
const MediaCard = ({ link, height, titleSize, chip, onClick }: { link: LinkInterface; height: number; titleSize: number; chip?: string | null; onClick: () => void }) => {
  const photo = (link as unknown as { photo?: string }).photo;
  return (
    <Box
      {...pressable(onClick)}
      sx={{
        position: "relative",
        height,
        borderRadius: `${mobileTheme.radius.lg}px`,
        overflow: "hidden",
        cursor: "pointer",
        flex: 1,
        background: photo ? `${cssUrl(photo)} center / cover no-repeat, ${mobileTheme.colorWash}` : mobileTheme.colorWash,
        "&:active": { transform: "scale(0.985)" },
        transition: "transform 120ms ease"
      }}
    >
      {chip && (
        <Typography sx={{ position: "absolute", top: 12, left: 12, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FFFFFF", bgcolor: "rgba(0,0,0,0.28)", px: "10px", py: "5px", borderRadius: "999px" }}>
          {chip}
        </Typography>
      )}
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, pt: 5, pb: "14px", px: "14px", background: "linear-gradient(transparent, rgba(7,14,27,0.78))" }}>
        <Typography sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: titleSize, lineHeight: 1.2 }}>{link.text}</Typography>
      </Box>
    </Box>
  );
};

const ExploreCard = ({ icon, title, tagline, onClick }: { icon: string; title: string; tagline?: string | null; onClick: () => void }) => {
  const tc = mobileTheme.colors;
  return (
    <Box
      {...pressable(onClick)}
      sx={{ bgcolor: tc.surface, border: `1px solid ${tc.border}`, borderRadius: `${mobileTheme.radius.lg}px`, p: "14px", cursor: "pointer", "&:active": { transform: "scale(0.985)" }, transition: "transform 120ms ease" }}
    >
      <Box sx={{ width: 36, height: 36, borderRadius: "11px", bgcolor: tc.iconBackground, display: "flex", alignItems: "center", justifyContent: "center", mb: "10px" }}>
        <Icon sx={{ fontSize: 20, color: tc.primary }}>{icon}</Icon>
      </Box>
      <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 650, color: tc.text }}>{title}</Typography>
      {tagline && <Typography noWrap sx={{ fontSize: 11.5, color: tc.textSecondary, mt: "1px" }}>{tagline}</Typography>}
    </Box>
  );
};

export const DashboardPage = ({ config }: Props) => {
  const context = useContext(UserContext);
  const router = useRouter();
  const tc = mobileTheme.colors;
  const churchId = config?.church?.id;
  const jwt = context?.userChurch?.jwt;

  const [greetingWord, setGreetingWord] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [dateLine, setDateLine] = React.useState("");
  const [verse, setVerse] = React.useState<DailyVerse | null>(null);

  React.useEffect(() => {
    setFirstName(context?.person?.name?.first || context?.user?.firstName || "");

    const now = new Date();
    setDateLine(now.toLocaleDateString(DateHelper.locale, { weekday: "long", month: "long", day: "numeric" }));

    const hour = now.getHours();
    if (hour < 12) setGreetingWord(Locale.label("mobile.dashboard.goodMorning"));
    else if (hour < 17) setGreetingWord(Locale.label("mobile.dashboard.goodAfternoon"));
    else setGreetingWord(Locale.label("mobile.dashboard.goodEvening"));
  }, [context?.person, context?.user]);

  const { data: rawLinks, isLoading } = useChurchLinks(churchId, jwt);

  const links = useMemo<LinkInterface[]>(
    () => filterVisibleLinks(rawLinks, context?.userChurch).filter((l) => l.linkType !== "separator"),
    [rawLinks, context?.userChurch]
  );

  // The verse card is the VOTD entry point, so the votd link never also gets a card.
  const hasVotdLink = links.some((l) => l.linkType === "votd");
  const base = useMemo(() => links.filter((l) => l.linkType !== "votd"), [links]);

  React.useEffect(() => {
    if (!hasVotdLink) {
      setVerse(null);
      return;
    }
    let cancelled = false;
    loadDailyVerse().then((v) => { if (!cancelled) setVerse(v); });
    return () => { cancelled = true; };
  }, [hasVotdLink]);

  // Hero + featured keep the church's order; only the Explore grid adapts to engagement.
  const rest = useMemo(() => base.slice(FEATURED_COUNT), [base]);
  const { sorted: sortedRest, increment: incrementViewCount } = useEngagementSort(rest, LINK_VIEW_COUNTS_KEY, linkId);

  const navigate = (link: LinkInterface) => {
    incrementViewCount(linkId(link));
    const target = linkTarget(link);
    if (!target) return;
    if (target.external) openExternal(target.href);
    else router.push(target.href);
  };

  const [hero, ...featuredTwo] = base.slice(0, FEATURED_COUNT);
  const showMoreCard = sortedRest.length > EXPLORE_SLOTS + 1;
  const explore = showMoreCard ? sortedRest.slice(0, EXPLORE_SLOTS) : sortedRest;

  const signedIn = !!(context?.user);
  // Churches can hide the anonymous sign-in prompt or reword it (B1Admin > B1 Mobile).
  const appearance = config?.appearance as Record<string, string> | undefined;
  const hideSignInPrompt = appearance?.mobileHideSignInPrompt === "true";
  const signInPrompt = (appearance?.mobileSignInPromptText || "").trim() || Locale.label("mobile.dashboard.signInPrompt");
  const headingSx = { fontFamily: mobileTheme.fonts.serif, fontSize: 30, fontWeight: 600, color: tc.onBackground, lineHeight: 1.1 };

  const welcome = signedIn && firstName ? (
    <Box sx={{ mb: 2, minHeight: 56 }}>
      {dateLine && <Typography sx={{ ...eyebrowSx, mb: "2px" }}>{dateLine}</Typography>}
      <Typography component="h1" sx={headingSx}>{greetingWord ? `${greetingWord}, ${firstName}` : " "}</Typography>
    </Box>
  ) : !signedIn ? (
    <Box sx={{ mb: 2, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        {dateLine && <Typography sx={{ ...eyebrowSx, mb: "2px" }}>{dateLine}</Typography>}
        <Typography component="h1" sx={headingSx}>{Locale.label("mobile.dashboard.welcome")}</Typography>
        {!hideSignInPrompt && <Typography sx={{ fontSize: 13.5, color: tc.onBackground, opacity: 0.8, mt: "4px" }}>{signInPrompt}</Typography>}
      </Box>
      {!hideSignInPrompt && (
        <Box
          component={Link}
          href="/mobile/login?returnUrl=%2Fmobile%2Fdashboard"
          sx={{ flex: "none", px: "18px", py: "9px", borderRadius: "999px", bgcolor: tc.primary, color: tc.onPrimary, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
        >
          {Locale.label("mobile.components.signIn")}
        </Box>
      )}
    </Box>
  ) : null;

  if (isLoading && links.length === 0) return <ScreenSkeleton />;
  // Signed-out visitors still get the sign-in prompt while Home has nothing else to show.
  if (links.length === 0) return <EmptyDashboardPlaceholder config={config} head={signedIn || hideSignInPrompt ? undefined : <Box sx={{ px: "16px" }}>{welcome}</Box>} />;

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", px: `${mobileTheme.spacing.md}px`, pt: 1.5, pb: 3 }}>
      <NotificationPermissionBanner enabled={!!jwt} />

      {welcome}

      {hasVotdLink && (verse ? (
        <Box {...pressable(() => router.push("/mobile/votd"))} sx={{ borderRadius: `${mobileTheme.radius.xl}px`, background: mobileTheme.verseGradient, color: "#FFFFFF", p: "20px", pb: "16px", mb: 2, cursor: "pointer" }}>
          <Typography sx={{ fontFamily: mobileTheme.fonts.serif, fontStyle: "italic", fontSize: 19, lineHeight: 1.45, mb: "10px" }}>{verse.text}</Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
            {verse.reference} · {Locale.label("mobile.components.verseOfTheDay")}
          </Typography>
        </Box>
      ) : <Box sx={{ height: 132, borderRadius: `${mobileTheme.radius.xl}px`, bgcolor: tc.surfaceVariant, mb: 2 }} />)}

      {hero && (
        <Box sx={{ mb: featuredTwo.length > 0 ? "12px" : 3 }}>
          <MediaCard link={hero} height={176} titleSize={22} chip={linkTypeToTagline(hero.linkType)} onClick={() => navigate(hero)} />
        </Box>
      )}

      {featuredTwo.length > 0 && (
        <Box sx={{ display: "flex", gap: "12px", mb: 3 }}>
          {featuredTwo.map((item) => <MediaCard key={linkId(item)} link={item} height={110} titleSize={15} onClick={() => navigate(item)} />)}
        </Box>
      )}

      {(explore.length > 0 || showMoreCard) && (
        <Box>
          <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>{Locale.label("mobile.components.explore")}</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }, gap: "12px" }}>
            {explore.map((item) => (
              <ExploreCard key={linkId(item)} icon={linkTypeToIcon(item.linkType, item.icon)} title={item.text || ""} tagline={linkTypeToTagline(item.linkType)} onClick={() => navigate(item)} />
            ))}
            {showMoreCard && <ExploreCard icon="more_horiz" title={Locale.label("mobile.components.more")} onClick={() => router.push("/mobile/more")} />}
          </Box>
        </Box>
      )}
    </Box>
  );
};
