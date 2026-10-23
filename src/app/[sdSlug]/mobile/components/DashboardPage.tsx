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
import { cssUrl, formatDate, formatDuration } from "./util";
import { NotificationPermissionBanner } from "./NotificationPermissionBanner";
import { navLinks } from "./MobileAppBar";
import { MAX_LINK_TABS } from "./MobileTabBar";
import { PageHead, Pill, PillRow, Plate, PlateSection, Row, RowList, TextLink, Thumb } from "./kit";
import { ScreenSkeleton } from "./ScreenSkeleton";
import { filterVisibleLinks, useChurchLinks } from "../hooks/useConfig";
import { useEngagementSort } from "../hooks/useEngagementSort";
import { EmptyDashboardPlaceholder } from "./EmptyDashboardPlaceholder";
import { memberGivingYearLimit } from "../helpers/givingYears";
import { loadDailyVerse, type DailyVerse } from "../helpers/dailyVerses";
import { LINK_VIEW_COUNTS_KEY, linkId, linkTarget, openExternal } from "../helpers/dashboardLinks";
import { useMyAttendance, useMyFormSubmissions } from "../helpers/myRecords";
import { AttendanceTeaser, EventsTeaser, FormsTeaser, GivingTeaser, GroupsTeaser, ServingTeaser, useGivingSummary, useMyGroups, useUpcomingEvents, useUpcomingServing } from "./HomeTeasers";

interface Props {
  config: ConfigurationInterface;
}

const linkPhoto = (l: LinkInterface) => (l as unknown as { photo?: string }).photo;

// Churches that built their app from photo page links (ICOM, SICOM) get those as tiles instead of pills.
// fixedWidth tiles sit in the sideways-scrolling row instead of the grid.
const PhotoTile = ({ link, wide, fixedWidth }: { link: LinkInterface; wide: boolean; fixedWidth?: boolean }) => {
  const target = linkTarget(link)!;
  const external = target.external ? { component: "button" as const, type: "button" as const, onClick: () => openExternal(target.href) } : { component: Link, href: target.href };
  return (
    <Box
      {...external}
      sx={{
        gridColumn: wide ? "1 / -1" : undefined,
        flex: fixedWidth ? { xs: "0 0 150px", md: "0 0 220px" } : undefined,
        scrollSnapAlign: fixedWidth ? "start" : undefined,
        position: "relative",
        height: wide ? { xs: 150, md: 260 } : { xs: 104, md: 180 },
        borderRadius: "10px",
        overflow: "hidden",
        border: 0,
        p: 0,
        display: "block",
        textAlign: "left",
        cursor: "pointer",
        textDecoration: "none",
        background: `${cssUrl(linkPhoto(link))} center / cover no-repeat, ${mobileTheme.colorWash}`,
        "&:active": { transform: "scale(0.985)" },
        transition: "transform 120ms ease"
      }}
    >
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, pt: 4, pb: "10px", px: "12px", background: "linear-gradient(transparent, rgba(7,14,27,0.78))" }}>
        <Typography sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: wide ? 18 : 14.5, lineHeight: 1.2 }}>{link.text}</Typography>
      </Box>
    </Box>
  );
};

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
  // Churches can hide the anonymous sign-in prompt or reword it, and opt in to the Me tab's attendance and forms on Home (B1Admin > B1 Mobile).
  const appearance = config?.appearance as Record<string, string> | undefined;
  const homeAttendance = signedIn && appearance?.mobileHomeAttendance === "true";
  const homeForms = signedIn && appearance?.mobileHomeForms === "true";
  const serving = useUpcomingServing(has("plans"));
  // Attendance rows are titled by group, so its groups load even when the church has no Groups link.
  const groups = useMyGroups(has("groups") || homeAttendance);
  const { data: attendance = [] } = useMyAttendance(homeAttendance);
  const { data: formSubmissions = [] } = useMyFormSubmissions(homeForms);
  const events = useUpcomingEvents(signedIn);
  // The teaser shows this year's total, so it steps aside (donation link falls back to a pill) when the church hides this year.
  const showGiving = has("donation") && config?.allowDonations !== false && memberGivingYearLimit(config?.appearance as Record<string, unknown>) >= new Date().getFullYear();
  const givingSummary = useGivingSummary(showGiving);
  const showServing = serving.upcoming.length > 0;
  const showGroups = has("groups") && groups.length > 0;
  const showEvents = signedIn && events.length > 0;

  // Tiles skip the tab-bar dedupe so a photo-link church still gets its whole menu on Home.
  const tileLinks = useMemo(() => links.filter((l) => linkPhoto(l) && linkTarget(l)), [links]);

  // Links already in the tab bar, shown as tiles, or shown as their own section don't repeat as pills.
  const pillLinks = useMemo(() => {
    const tabRoutes = new Set(navLinks(links, MAX_LINK_TABS).map((t) => t.route));
    return links.filter((l) => {
      if (l.linkType === "votd" || linkPhoto(l) || (latest && l.linkType === "sermons")) return false;
      if ((showServing && l.linkType === "plans") || (showGroups && l.linkType === "groups") || (showGiving && l.linkType === "donation")) return false;
      const target = linkTarget(l);
      return !!target && !tabRoutes.has(target.href);
    });
  }, [links, latest, showServing, showGroups, showGiving]);
  const { sorted: sortedPills, increment: incrementViewCount } = useEngagementSort(pillLinks, LINK_VIEW_COUNTS_KEY, linkId);

  const hideSignInPrompt = appearance?.mobileHideSignInPrompt === "true";
  const tileLayout = appearance?.mobileTileLayout === "scroll" || appearance?.mobileTileLayout === "list" ? appearance.mobileTileLayout : "grid";
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

  if (isLoading && links.length === 0) return <ScreenSkeleton />;
  // Signed-out visitors still get the sign-in prompt while Home has nothing else to show.
  if (links.length === 0) return <EmptyDashboardPlaceholder config={config} head={signedIn || hideSignInPrompt ? undefined : head} />;

  const banner = <NotificationPermissionBanner enabled={!!jwt} />;

  const tileSection = tileLinks.length > 0 && (
    <PlateSection title={churchName || undefined}>
      {tileLayout === "list" ? (
        <RowList>
          {tileLinks.map((l) => {
            const target = linkTarget(l)!;
            const nav = target.external ? { onClick: () => openExternal(target.href) } : { href: target.href };
            return <Row key={linkId(l)} {...nav} title={l.text} leading={<Thumb src={linkPhoto(l)} width={56} height={56} />} chevron />;
          })}
        </RowList>
      ) : tileLayout === "scroll" ? (
        <Box data-testid="home-tile-scroll" sx={{ display: "flex", gap: "8px", overflowX: "auto", scrollSnapType: "x mandatory", pb: "4px", "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
          {tileLinks.map((l) => <PhotoTile key={linkId(l)} link={l} wide={false} fixedWidth />)}
        </Box>
      ) : (
        <Box data-testid="home-tile-grid" sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {tileLinks.map((l, i) => <PhotoTile key={linkId(l)} link={l} wide={i === 0 && tileLinks.length % 2 === 1} />)}
        </Box>
      )}
    </PlateSection>
  );

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
  const eventsSection = showEvents && <EventsTeaser events={events} />;
  const attendanceSection = homeAttendance && attendance.length > 0 && <AttendanceTeaser attendance={attendance} groups={groups} />;
  const formsSection = homeForms && formSubmissions.length > 0 && <FormsTeaser submissions={formSubmissions} />;
  const givingSection = showGiving && <GivingTeaser summary={givingSummary} />;
  const wide = [tileSection, sermonSection, servingSection, groupsSection, eventsSection, attendanceSection, formsSection].some(Boolean);
  const narrow = [verseSection, givingSection, moreSection].some(Boolean);

  return (
    <Box>
      {head}
      {desktop && wide && narrow ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "24px", alignItems: "start" }}>
          <Plate>{banner}{tileSection}{sermonSection}{servingSection}{groupsSection}{eventsSection}{attendanceSection}{formsSection}</Plate>
          <Plate>{verseSection}{givingSection}{moreSection}</Plate>
        </Box>
      ) : (
        // :empty hides the sheet when the only candidate (the push banner) renders nothing.
        <Plate sx={{ "&:empty": { display: "none" } }}>{banner}{tileSection}{sermonSection}{verseSection}{servingSection}{groupsSection}{eventsSection}{attendanceSection}{formsSection}{givingSection}{moreSection}</Plate>
      )}
    </Box>
  );
};
