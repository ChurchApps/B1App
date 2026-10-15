"use client";

import React from "react";
import { Box, Button, Skeleton } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { useQuery } from "@tanstack/react-query";
import type { EventInterface, GroupInterface, GroupMemberInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { BackVerb, PageHead, Pill, PillRow, Plate, PlateSection, QuietEmpty, RecordLayout, Row, RowList, TextLink, Thumb } from "../kit";
import { DateHelper } from "@churchapps/helpers";

interface Props {
  idOrSlug: string;
  config: ConfigurationInterface;
}

export const AnonymousGroupView = ({ idOrSlug, config }: Props) => {
  const tc = mobileTheme.colors;
  const churchId = config.church.id;

  const { data: group, isLoading: groupLoading } = useQuery<GroupInterface | null>({
    queryKey: ["group-public", churchId, idOrSlug],
    queryFn: async () => {
      // `idOrSlug` may be a real group id (shortIds can contain '-' or '_') or a slug,
      // so we can't tell them apart by shape — try the id lookup first, then the slug.
      const tryPublic = async (url: string) => {
        try {
          const d = await ApiHelper.getAnonymous(url, "MembershipApi");
          return d || null;
        } catch {
          return null;
        }
      };
      return (
        (await tryPublic(`/groups/public/${churchId}/${idOrSlug}`)) ||
        (await tryPublic(`/groups/public/${churchId}/slug/${idOrSlug}`))
      );
    },
    enabled: !!idOrSlug && !!churchId
  });

  const groupId = group?.id;

  const { data: leaders = [] } = useQuery<GroupMemberInterface[]>({
    queryKey: ["group-leaders-public", churchId, groupId],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous(
        `/groupMembers/public/leaders/${churchId}/${groupId}`,
        "MembershipApi"
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId
  });

  const { data: events = [] } = useQuery<EventInterface[]>({
    queryKey: ["group-events-public", churchId, groupId],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous(
        `/events/public/group/${churchId}/${groupId}`,
        "ContentApi"
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId
  });

  const upcomingEvents = React.useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((e) => e.start && new Date(e.start) > now)
      .sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime())
      .slice(0, 3);
  }, [events]);

  const returnUrl = encodeURIComponent((typeof window !== "undefined" ? window.location.pathname : `/mobile/groups/${idOrSlug}`) + "?join=1");

  if (groupLoading) {
    return (
      <Box sx={{ px: { xs: "16px", md: 0 } }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="rounded" height={160} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (!group) {
    return (
      <>
        <PageHead title={Locale.label("mobile.details.groupNotFound")} lede={Locale.label("mobile.details.groupNotFoundDescription")} />
        <BackVerb href="/mobile/groups" label={Locale.label("mobile.details.backToGroups")} />
      </>
    );
  }

  const schedule = [group.meetingTime, group.meetingLocation].filter(Boolean).join(" · ");
  const hasAbout = !!group.about;

  return (
    <RecordLayout
      identity={(
        <>
          {group.photoUrl && <Box sx={{ display: { xs: "none", md: "block" }, mb: "16px" }}><Thumb src={group.photoUrl} alt={group.name} width="100%" height="auto" /></Box>}
          <PageHead title={group.name} lede={schedule || undefined}>
            <Button variant="contained" href={`/mobile/login?returnUrl=${returnUrl}`} data-testid="anonymous-group-sign-in">
              {Locale.label("mobile.group.signInToJoin")}
            </Button>
          </PageHead>
        </>
      )}
    >
      <Plate>
        <PlateSection title={Locale.label("mobile.details.about")}>
          {hasAbout
            ? <Box sx={{ fontSize: 15, lineHeight: "22px", color: tc.text, "& p": { mt: 0, mb: 1 }, "& p:last-child": { mb: 0 }, "& a": { color: tc.link } }}><MarkdownPreviewLight value={group.about || ""} /></Box>
            : <QuietEmpty>{Locale.label("mobile.details.noDetailsYet")}</QuietEmpty>}
        </PlateSection>
        {leaders.length > 0 && (
          <PlateSection title={Locale.label("mobile.group.leaders")}>
            <PillRow>
              {leaders.map((l) => (
                <Pill key={l.id} href={l.person?.id ? `/mobile/community/${l.person.id}` : undefined}>{l.person?.name?.display}</Pill>
              ))}
            </PillRow>
          </PlateSection>
        )}
        {upcomingEvents.length > 0 && (
          <PlateSection title={Locale.label("mobile.screens.upcomingEvents")}>
            <RowList>
              {upcomingEvents.map((e) => {
                const start = new Date(e.start!);
                const when = start.toLocaleString(DateHelper.locale, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
                return (
                  <Row
                    key={e.id}
                    title={e.title}
                    subtitle={[when, e.description].filter(Boolean).join(" · ")}
                    trailing={e.registrationEnabled && e.id ? <TextLink href={`/mobile/register/${e.id}`}>{Locale.label("mobile.group.register")}</TextLink> : undefined}
                  />
                );
              })}
            </RowList>
          </PlateSection>
        )}
      </Plate>
    </RecordLayout>
  );
};

export default AnonymousGroupView;
