"use client";

import React, { useContext } from "react";
import { Box, Button, Skeleton, Typography } from "@mui/material";
import { ApiHelper, Locale, UserHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { LoadErrorAlert } from "../LoadErrorAlert";
import { Eyebrow, Highlight, PageHead, PersonAvatar, Plate, QuietEmpty, Row, RowList, SearchField } from "../kit";

interface Props {
  config?: ConfigurationInterface;
}

interface PeopleSection {
  title: string;
  people: PersonInterface[];
}

const STATUS_RANK: Record<string, number> = { staff: 3, member: 2, "regular attendee": 1 };
const REQUIRED_RANK: Record<string, number> = { Staff: 3, Members: 2, "Regular Attendees": 1, Everyone: 0 };

export const CommunityPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;
  const membershipStatus = (context?.userChurch?.person as any)?.membershipStatus?.toLowerCase();
  const [searchText, setSearchText] = React.useState("");

  const churchId = UserHelper.currentUserChurch?.church?.id || config?.church?.id;
  const { data: publicSettings, isFetched: settingsFetched } = useQuery<any>({
    queryKey: ["publicSettings", churchId],
    queryFn: () => ApiHelper.get(`/settings/public/${churchId}`, "MembershipApi"),
    enabled: loggedIn && !!churchId
  });

  const canViewDirectory = loggedIn && (STATUS_RANK[membershipStatus] || 0) >= (REQUIRED_RANK[publicSettings?.directoryVisibility] ?? REQUIRED_RANK.Members);
  const settingsSettled = !loggedIn || !churchId || settingsFetched;

  const { data: serverPeople = null, isFetching, isError: peopleError, refetch: refetchPeople } = useQuery<PersonInterface[]>({
    queryKey: ["/people", "MembershipApi"],
    queryFn: async () => {
      const data = await ApiHelper.get("/people", "MembershipApi");
      const list = Array.isArray(data) ? (data as PersonInterface[]) : [];
      return Array.from(new Map(list.map((p) => [p.id, p])).values());
    },
    enabled: canViewDirectory,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const people = canViewDirectory ? (isFetching && !serverPeople ? null : (serverPeople ?? null)) : [];

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
    const otherLabel = Locale.label("mobile.screens.otherLetter");
    const groups: { [key: string]: PersonInterface[] } = {};

    filteredPeople.forEach((p) => {
      const lastRaw = (p.name?.last || "").trim();
      const firstRaw = (p.name?.first || "").trim();
      const displayRaw = (p.name?.display || "").trim();

      let letter = otherLabel;
      if (firstRaw) {
        letter = firstRaw.charAt(0).toUpperCase();
      } else if (displayRaw) {

        const parts = displayRaw.split(" ");
        const fallback = parts.length > 1 ? parts[parts.length - 1] : parts[0];
        if (fallback) letter = fallback.charAt(0).toUpperCase();
      } else if (lastRaw) {
        letter = lastRaw.charAt(0).toUpperCase();
      }

      if (!/^[A-Z]$/.test(letter)) letter = otherLabel;

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
      if (a === otherLabel) return 1;
      if (b === otherLabel) return -1;
      return a.localeCompare(b);
    });

    return letters.map((letter) => ({ title: letter, people: groups[letter] }));
  }, [filteredPeople]);

  const title = Locale.label("mobile.screenTitles.directory");

  if (settingsSettled && !canViewDirectory) {
    const returnUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";
    const loginHref = returnUrl ? `/mobile/login?returnUrl=${returnUrl}` : "/mobile/login";
    return (
      <Box>
        <PageHead title={title} />
        <Plate sx={{ px: { xs: "16px", md: "24px" }, py: "22px" }}>
          <Typography component="h2" sx={{ fontSize: 17, fontWeight: 650, color: tc.text }}>
            {Locale.label(loggedIn ? "mobile.screens.membersOnly" : "mobile.details.signInRequired")}
          </Typography>
          <QuietEmpty sx={{ mt: "4px" }}>
            {Locale.label(loggedIn ? "mobile.screens.directoryMembersBody" : "mobile.screens.directorySignInBody")}
          </QuietEmpty>
          {!loggedIn && (
            <Button variant="contained" sx={{ mt: "16px" }} onClick={() => { window.location.href = loginHref; }}>
              {Locale.label("mobile.components.signIn")}
            </Button>
          )}
        </Plate>
      </Box>
    );
  }

  const renderRow = (p: PersonInterface) => {
    const display = p.name?.display || [p.name?.first, p.name?.last].filter(Boolean).join(" ") || Locale.label("mobile.components.unknown");
    return (
      <Row
        key={p.id}
        href={`/mobile/community/${p.id}`}
        leading={<PersonAvatar person={p} />}
        title={<Highlight text={display} term={searchText} />}
        subtitle={(p as { membershipStatus?: string }).membershipStatus || undefined}
        chevron
      />
    );
  };

  return (
    <Box>
      <PageHead
        title={title}
        lede={people && people.length > 0 ? Locale.label("mobile.community.peopleCount").replace("{}", String(people.length)) : undefined}
      />
      <Plate>
        <Box sx={{ px: { xs: "16px", md: "24px" }, pt: { xs: "16px", md: "22px" }, pb: "4px" }}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            label={Locale.label("mobile.screens.searchMembers")}
            placeholder={Locale.label("mobile.community.searchByName")}
          />
        </Box>
        <Box sx={{ px: { xs: "16px", md: "24px" }, pt: "8px", pb: "16px" }}>
          {filteredPeople === null && peopleError && <LoadErrorAlert onRetry={() => refetchPeople()} />}
          {filteredPeople === null && !peopleError && [0, 1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "12px", minHeight: 56 }}>
              <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: "10px" }} />
              <Skeleton variant="text" width="45%" height={20} />
            </Box>
          ))}
          {filteredPeople !== null && sections.length === 0 && <QuietEmpty sx={{ py: "12px" }}>{Locale.label("mobile.screens.noMembersFound")}</QuietEmpty>}
          {sections.map((section) => (
            <Box key={section.title} component="section" aria-label={section.title} sx={{ mt: "10px" }}>
              <Eyebrow component="h3">{section.title}</Eyebrow>
              <RowList>{section.people.map(renderRow)}</RowList>
            </Box>
          ))}
        </Box>
      </Plate>
    </Box>
  );
};
