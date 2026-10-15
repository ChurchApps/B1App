"use client";

import React, { useContext, useMemo } from "react";
import Link from "next/link";
import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useQuery } from "@tanstack/react-query";
import { type LinkInterface, type SermonInterface, DateHelper } from "@churchapps/helpers";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "./mobileTheme";
import { formatDate, formatDuration } from "./util";
import { NotificationPermissionBanner } from "./NotificationPermissionBanner";
import { navLinks } from "./MobileAppBar";
import { MAX_LINK_TABS } from "./MobileTabBar";
import { PageHead, Pill, PillRow, Plate, PlateSection, Row, TextLink, Thumb } from "./kit";
import { ScreenSkeleton } from "./ScreenSkeleton";
import { filterVisibleLinks, useChurchLinks } from "../hooks/useConfig";
import { useEngagementSort } from "../hooks/useEngagementSort";
import { EmptyDashboardPlaceholder } from "./EmptyDashboardPlaceholder";
import { loadDailyVerse, type DailyVerse } from "../helpers/dailyVerses";
import { LINK_VIEW_COUNTS_KEY, linkId, linkTarget, openExternal } from "../helpers/dashboardLinks";
import { GivingTeaser, GroupsTeaser, ServingTeaser, useGivingSummary, useMyGroups, useUpcomingServing } from "./HomeTeasers";

interface Props {
  config: ConfigurationInterface;
}

export const DashboardPage = ({ config }: Props) => {
  const context = useContext(UserContext);
  const tc = mobileTheme.colors;
  const churchId = config?.church?.id;
  const churchName = config?.church?.name || "";
  const jwt = context?.userChurch?.jwt;
  const desktop = useMediaQuery((t: Theme) => t.breakpoints.up("md"));

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

  // The verse is the church's VOTD feature on the dashboard — hidden when the church removed the link.
  const hasVotdLink = links.some((l) => l.linkType === "votd");
  const hasSermonsLink = links.some((l) => l.linkType === "sermons");

  React.useEffect(() => {
    if (!hasVotdLink) {
      setVerse(null);
      return;
    }
    let cancelled = false;
    loadDailyVerse().then((v) => { if (!cancelled) setVerse(v); });
    return () => { cancelled = true; };
  }, [hasVotdLink]);

  // Same query (key + shape) as SermonsPage, so the two share one cache entry.
  const { data: sermons = [] } = useQuery<SermonInterface[]>({
    queryKey: ["sermons", churchId],
    queryFn: async () => {
      const result = await ApiHelper.getAnonymous(`/sermons/public/${churchId}`, "ContentApi");
      const list: SermonInterface[] = Array.isArray(result)
        ? result.filter((s: any) => s && s.id && s.title)
        : [];
      list.sort((a, b) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime());
      return list;
    },
    enabled: !!churchId && hasSermonsLink,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });
  const latest = hasSermonsLink ? sermons[0] : undefined;

  const signedIn = !!(context?.user);
  const has = (type: string) => signedIn && links.some((l) => l.linkType === type);
  const serving = useUpcomingServing(has("plans"));
  const groups = useMyGroups(has("groups"));
  const showGiving = has("donation") && config?.allowDonations !== false;
  const givingSummary = useGivingSummary(showGiving);
  const showServing = serving.upcoming.length > 0;
  const showGroups = has("groups") && groups.length > 0;

  // Links already in the tab bar or shown as their own section don't repeat as pills.
  const pillLinks = useMemo(() => {
    const tabRoutes = new Set(navLinks(links, MAX_LINK_TABS).map((t) => t.route));
    return links.filter((l) => {
      if (l.linkType === "votd" || (latest && l.linkType === "sermons")) return false;
      if ((showServing && l.linkType === "plans") || (showGroups && l.linkType === "groups") || (showGiving && l.linkType === "donation")) return false;
      const target = linkTarget(l);
      return !!target && !tabRoutes.has(target.href);
    });
  }, [links, latest, showServing, showGroups, showGiving]);
  const { sorted: sortedPills, increment: incrementViewCount } = useEngagementSort(pillLinks, LINK_VIEW_COUNTS_KEY, linkId);

  if (isLoading && links.length === 0) return <ScreenSkeleton />;
  if (links.length === 0) return <EmptyDashboardPlaceholder config={config} />;

  // Churches can hide the anonymous sign-in prompt or reword it (B1Admin > B1 Mobile).
  const appearance = config?.appearance as Record<string, string> | undefined;
  const hideSignInPrompt = appearance?.mobileHideSignInPrompt === "true";
  const signInPrompt = (appearance?.mobileSignInPromptText || "").trim() || Locale.label("mobile.dashboard.signInPrompt");

  const head = signedIn
    ? <PageHead title={greetingWord ? (firstName ? `${greetingWord}, ${firstName}` : greetingWord) : " "} lede={dateLine} />
    : (
      <PageHead title={Locale.label("mobile.dashboard.welcome")} lede={hideSignInPrompt ? dateLine : signInPrompt}>
        {!hideSignInPrompt && (
          <Button variant="contained" component={Link} href="/mobile/login?returnUrl=%2Fmobile%2Fdashboard">
            {Locale.label("mobile.components.signIn")}
          </Button>
        )}
      </PageHead>
    );

  const banner = <NotificationPermissionBanner enabled={!!jwt} />;

  const sermonSection = latest && (
    <PlateSection
      title={Locale.label("mobile.dashboard.latestSermon")}
      action={<TextLink href="/mobile/sermons">{Locale.label("mobile.dashboard.allSermons")}</TextLink>}
    >
      <Row
        href={`/mobile/sermons/${latest.id}${latest.title ? `?title=${encodeURIComponent(latest.title)}` : ""}`}
        leading={(
          <Thumb src={latest.thumbnail || undefined}>
            <PlayArrowIcon sx={{ position: "absolute", left: 6, bottom: 4, fontSize: 20, color: "#fff" }} />
          </Thumb>
        )}
        title={latest.title || Locale.label("mobile.components.untitledSermon")}
        subtitle={[formatDate(latest.publishDate, "short"), formatDuration(latest.duration)].filter(Boolean).join(" · ")}
        sx={{ py: 0 }}
      />
    </PlateSection>
  );

  const verseSection = hasVotdLink && (
    <PlateSection title={Locale.label("mobile.components.verseOfTheDay")}>
      {verse ? (
        <Box component={Link} href="/mobile/votd" sx={{ display: "block", textDecoration: "none", color: "inherit" }}>
          <Typography sx={{ fontFamily: mobileTheme.fonts.serif, fontStyle: "italic", fontSize: 20, lineHeight: "30px", color: tc.text }}>
            {verse.text}
          </Typography>
          <Typography sx={{ mt: "8px", fontSize: 13.5, fontWeight: 600, color: tc.textSecondary }}>{verse.reference}</Typography>
        </Box>
      ) : <Box sx={{ height: 68, borderRadius: "6px", bgcolor: tc.surfaceVariant }} />}
    </PlateSection>
  );

  const moreSection = sortedPills.length > 0 && (
    <PlateSection title={churchName ? Locale.label("mobile.dashboard.moreFrom").replace("{}", churchName) : Locale.label("mobile.components.more")}>
      <PillRow>
        {sortedPills.map((l) => {
          const target = linkTarget(l)!;
          const count = () => incrementViewCount(linkId(l));
          return target.external
            ? <Pill key={linkId(l)} onClick={() => { count(); openExternal(target.href); }}>{l.text}</Pill>
            : <Pill key={linkId(l)} href={target.href} onClick={count}>{l.text}</Pill>;
        })}
      </PillRow>
    </PlateSection>
  );

  const servingSection = showServing && <ServingTeaser {...serving} />;
  const groupsSection = showGroups && <GroupsTeaser groups={groups} />;
  const givingSection = showGiving && <GivingTeaser summary={givingSummary} />;
  const wide = [sermonSection, servingSection, groupsSection].some(Boolean);
  const narrow = [verseSection, givingSection, moreSection].some(Boolean);

  return (
    <Box>
      {head}
      {desktop && wide && narrow ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "24px", alignItems: "start" }}>
          <Plate>{banner}{sermonSection}{servingSection}{groupsSection}</Plate>
          <Plate>{verseSection}{givingSection}{moreSection}</Plate>
        </Box>
      ) : (
        // :empty hides the sheet when the only candidate (the push banner) renders nothing.
        <Plate sx={{ "&:empty": { display: "none" } }}>{banner}{sermonSection}{verseSection}{servingSection}{groupsSection}{givingSection}{moreSection}</Plate>
      )}
    </Box>
  );
};
