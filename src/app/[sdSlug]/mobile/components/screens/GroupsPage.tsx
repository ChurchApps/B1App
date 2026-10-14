"use client";

import React, { useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Skeleton, Typography, useMediaQuery } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { EventInterface, GroupInterface, GroupJoinRequestInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { useEngagementSort } from "../../hooks/useEngagementSort";
import { LoadErrorAlert } from "../LoadErrorAlert";
import { DateHelper } from "@churchapps/helpers";
import { PageHead, PersonAvatar, Plate, PlateSection, QuietEmpty, Row, RowList, SearchField, TextLink } from "../kit";

interface Props {
  config?: ConfigurationInterface;
}

const ENGAGEMENT_STORAGE_KEY = "b1app-group-view-counts";
const TOP_GROUPS = 5;
const tc = mobileTheme.colors;

export const GroupsPage = ({ config: _config }: Props) => {
  const router = useRouter();
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;
  const desktop = useMediaQuery("(min-width:900px)");
  const [search, setSearch] = React.useState("");

  const { data: groups = null, isError: groupsError, refetch: refetchGroups } = useQuery<GroupInterface[]>({
    queryKey: ["my-groups", context?.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/groups/my", "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const { data: pendingRequests = [], refetch: refetchPending } = useQuery<GroupJoinRequestInterface[]>({
    queryKey: ["my-pending-requests", context?.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/groupjoinrequests/my", "MembershipApi");
      return Array.isArray(data) ? data.filter((r: GroupJoinRequestInterface) => r.status === "pending") : [];
    },
    enabled: loggedIn,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const [cancelRequestError, setCancelRequestError] = React.useState("");

  const handleCancelRequest = async (id: string) => {
    setCancelRequestError("");
    try {
      await ApiHelper.delete(`/groupjoinrequests/${id}`, "MembershipApi");
      refetchPending();
    } catch {
      setCancelRequestError(Locale.label("mobile.screens.unableToSaveChanges"));
    }
  };

  const { data: registerableEvents = [] } = useQuery<EventInterface[]>({
    queryKey: ["events-registerable", context?.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/events/registerable", "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  // /events/registerable returns every registration-enabled event; only show ones that haven't ended (or recur).
  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return registerableEvents.filter((event) => {
      if (event.recurrenceRule) return true;
      const endTime = new Date(event.end || event.start || "").getTime();
      return isNaN(endTime) || endTime >= now;
    });
  }, [registerableEvents]);

  const effectiveGroups = loggedIn ? groups : [];

  const getGroupId = useCallback((g: GroupInterface) => g.id || "", []);
  const { sorted: orderedGroups, increment: incrementViewCount } = useEngagementSort(
    effectiveGroups,
    ENGAGEMENT_STORAGE_KEY,
    getGroupId
  );

  const query = search.trim().toLowerCase();
  const matches = useMemo(
    () => (query ? orderedGroups.filter((g) => (g.name || "").toLowerCase().includes(query)) : orderedGroups),
    [orderedGroups, query]
  );
  const yourGroups = query ? matches : matches.slice(0, TOP_GROUPS);
  const otherGroups = query ? [] : matches.slice(TOP_GROUPS);

  const formatEventTime = (event: EventInterface) => {
    if (!event.start) return "";
    const start = new Date(event.start);
    if (isNaN(start.getTime())) return "";
    if (event.allDay) {
      return `${start.toLocaleDateString(DateHelper.locale, { month: "short", day: "numeric", year: "numeric" })} (${Locale.label("mobile.group.allDay")})`;
    }
    const fmtDate = (d: Date) => d.toLocaleDateString(DateHelper.locale, { weekday: "short", month: "short", day: "numeric" });
    const fmtTime = (d: Date) => d.toLocaleTimeString(DateHelper.locale, { hour: "numeric", minute: "2-digit" });
    if (!event.end) return `${fmtDate(start)} · ${fmtTime(start)}`;
    const end = new Date(event.end);
    if (isNaN(end.getTime())) return `${fmtDate(start)} · ${fmtTime(start)}`;
    if (start.toDateString() === end.toDateString()) {
      return `${fmtDate(start)} · ${fmtTime(start)} – ${fmtTime(end)}`;
    }
    return `${fmtDate(start)} ${fmtTime(start)} – ${fmtDate(end)} ${fmtTime(end)}`;
  };

  const groupSubtext = (group: GroupInterface) => [group.meetingTime?.trim(), group.meetingLocation?.trim()].filter(Boolean).join(" · ") || undefined;

  const renderGroupRows = (list: GroupInterface[]) => (
    <RowList>
      {list.map((group) => (
        <Row
          key={group.id}
          href={`/mobile/groups/${group.id}`}
          onClick={() => { if (group.id) incrementViewCount(group.id); }}
          leading={<PersonAvatar name={group.name} src={group.photoUrl || undefined} />}
          title={group.name}
          subtitle={groupSubtext(group)}
          chevron
        />
      ))}
    </RowList>
  );

  const hasAnyGroups = effectiveGroups !== null && effectiveGroups.length > 0;

  const renderEmpty = () => {
    const returnUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";
    return (
      <PlateSection>
        <Typography sx={{ fontSize: 17, lineHeight: "24px", fontWeight: 600, color: tc.text }}>
          {Locale.label(loggedIn ? "mobile.screens.noGroupsTitle" : "mobile.screens.groupsSignInTitle")}
        </Typography>
        <QuietEmpty>{Locale.label(loggedIn ? "mobile.screens.noGroupsBody" : "mobile.screens.groupsSignInBody")}</QuietEmpty>
        <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap", mt: "16px" }}>
          {!loggedIn && (
            <Button variant="contained" href={returnUrl ? `/mobile/login?returnUrl=${returnUrl}` : "/mobile/login"} data-testid="groups-sign-in">
              {Locale.label("mobile.components.signIn")}
            </Button>
          )}
          <Button variant="outlined" onClick={() => router.push("/groups")} data-testid="groups-browse">
            {Locale.label("mobile.screens.browseGroups")}
          </Button>
        </Box>
      </PlateSection>
    );
  };

  const mainSections = (
    <>
      {effectiveGroups === null && groupsError && <PlateSection><LoadErrorAlert onRetry={() => refetchGroups()} /></PlateSection>}
      {effectiveGroups === null && !groupsError && (
        <PlateSection>
          {[0, 1, 2].map((k) => (
            <Box key={k} sx={{ display: "flex", alignItems: "center", gap: "12px", py: "8px" }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="40%" /></Box>
            </Box>
          ))}
        </PlateSection>
      )}
      {effectiveGroups !== null && effectiveGroups.length === 0 && renderEmpty()}
      {hasAnyGroups && (
        <PlateSection>
          <SearchField value={search} onChange={setSearch} label={Locale.label("mobile.group.searchYourGroups")} testId="groups-search" />
        </PlateSection>
      )}
      {hasAnyGroups && (
        <PlateSection title={Locale.label("mobile.group.yourGroups")}>
          {yourGroups.length > 0 ? renderGroupRows(yourGroups) : <QuietEmpty>{Locale.label("mobile.group.noResults")}</QuietEmpty>}
        </PlateSection>
      )}
      {otherGroups.length > 0 && (
        <PlateSection title={Locale.label("mobile.screens.otherGroups")}>{renderGroupRows(otherGroups)}</PlateSection>
      )}
    </>
  );

  const sideSections = (
    <>
      {pendingRequests.length > 0 && (
        <PlateSection title={Locale.label("mobile.screens.pendingRequests")}>
          <Box data-testid="my-pending-requests">
            {cancelRequestError && <Typography sx={{ color: tc.error, fontSize: 14, mb: "8px" }}>{cancelRequestError}</Typography>}
            <RowList>
              {pendingRequests.map((req) => {
                const name = (req as any).groupName || req.group?.name || Locale.label("mobile.screens.groupFallback");
                return (
                  <Row
                    key={req.id}
                    data-testid={`my-pending-${req.id}`}
                    leading={<PersonAvatar name={name} />}
                    title={name}
                    subtitle={req.requestDate ? Locale.label("mobile.screens.requestedOn").replace("{}", new Date(req.requestDate).toLocaleDateString(DateHelper.locale)) : undefined}
                    trailing={<TextLink danger onClick={() => handleCancelRequest(req.id || "")} data-testid={`cancel-request-${req.id}`}>{Locale.label("mobile.group.cancelRequest")}</TextLink>}
                  />
                );
              })}
            </RowList>
          </Box>
        </PlateSection>
      )}
      {upcomingEvents.length > 0 && (
        <PlateSection title={Locale.label("mobile.screens.upcomingEvents")}>
          <RowList>
            {upcomingEvents.map((event) => (
              <Row
                key={event.id}
                title={event.title}
                subtitle={formatEventTime(event)}
                trailing={<TextLink href={`/mobile/register/${event.id}`}>{Locale.label("mobile.group.register")}</TextLink>}
              />
            ))}
          </RowList>
        </PlateSection>
      )}
    </>
  );

  const hasSide = pendingRequests.length > 0 || upcomingEvents.length > 0;
  const groupCount = effectiveGroups?.length || 0;
  const lede = loggedIn && effectiveGroups !== null
    ? [
      groupCount === 1 ? Locale.label("mobile.group.groupCountOne") : Locale.label("mobile.group.groupCount").replace("{}", String(groupCount)),
      pendingRequests.length ? Locale.label("mobile.group.pendingCount").replace("{}", String(pendingRequests.length)) : ""
    ].filter(Boolean).join(" · ")
    : undefined;

  return (
    <>
      <PageHead title={Locale.label("groupsPage.groupsHeading")} lede={lede}>
        {hasAnyGroups && (
          <Button variant="contained" startIcon={<SearchIcon />} onClick={() => router.push("/groups")}>
            {Locale.label("groupsPage.findAGroup")}
          </Button>
        )}
      </PageHead>
      {desktop && hasSide ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "24px", alignItems: "start" }}>
          <Plate>{mainSections}</Plate>
          <Plate>{sideSections}</Plate>
        </Box>
      ) : (
        <Plate>
          {mainSections}
          {sideSections}
        </Plate>
      )}
    </>
  );
};
