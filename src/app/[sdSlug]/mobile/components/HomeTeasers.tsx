"use client";

import React, { useContext, useState } from "react";
import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { GroupInterface } from "@churchapps/helpers";
import { ApiHelper, CurrencyHelper, DateHelper, Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "./mobileTheme";
import { ConfirmDeclineSheet } from "./ConfirmDeclineSheet";
import { BigNumber, PersonAvatar, PlateSection, Row, RowList, StatusBadge, TextLink } from "./kit";

interface UpcomingAssignment {
  assignmentId: string;
  status?: string;
  positionName?: string;
  planId: string;
  planName?: string;
  serviceDate: string | Date;
}

interface GivingSummary { year: number; total: number; count: number; currency: string; isConverted?: boolean }

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const isStatus = (a: UpcomingAssignment, s: string) => (a.status || "").toLowerCase() === s;

export const useUpcomingServing = (enabled: boolean) => {
  const userId = useContext(UserContext)?.user?.id;
  const queryKey = ["/assignments/my/upcoming", "DoingApi", userId];
  const query = useQuery<UpcomingAssignment[]>({
    queryKey,
    queryFn: async () => {
      const data = await ApiHelper.get("/assignments/my/upcoming", "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled,
    staleTime: 5 * 60 * 1000
  });
  const today = startOfToday();
  const upcoming = (query.data || []).filter((a) => !isStatus(a, "declined") && DateHelper.toDate(a.serviceDate) >= today);
  return { upcoming, queryKey };
};

export const useMyGroups = (enabled: boolean) => {
  const userId = useContext(UserContext)?.user?.id;
  // Same key and shape as GroupsPage, so both screens share one cache entry.
  const { data = [] } = useQuery<GroupInterface[]>({
    queryKey: ["my-groups", userId],
    queryFn: async () => {
      const data = await ApiHelper.get("/groups/my", "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });
  return data;
};

export const useGivingSummary = (enabled: boolean) => {
  const personId = useContext(UserContext)?.person?.id;
  const year = new Date().getFullYear();
  const { data } = useQuery<GivingSummary>({
    queryKey: ["donations-summary", personId, year],
    queryFn: () => ApiHelper.get(`/donations/my/summary?year=${year}`, "GivingApi"),
    enabled: enabled && !!personId
  });
  return data;
};

export const ServingTeaser = ({ upcoming, queryKey }: ReturnType<typeof useUpcomingServing>) => {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [declineTarget, setDeclineTarget] = useState<UpcomingAssignment | null>(null);
  const needsReply = upcoming.filter((a) => isStatus(a, "unconfirmed"));
  const rows = (needsReply.length ? needsReply : upcoming).slice(0, 2);

  const respond = async (a: UpcomingAssignment, action: "accept" | "decline") => {
    setBusyId(a.assignmentId);
    setError("");
    try {
      await ApiHelper.post(`/assignments/${action}/${a.assignmentId}`, [], "DoingApi");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["/assignments/my"] })
      ]);
    } catch (err: any) {
      setError(err?.message || Locale.label("mobile.details.unableToRespond").replace("{}", action));
    } finally {
      setBusyId("");
    }
  };

  return (
    <PlateSection title={Locale.label("mobile.dashboard.youreServing")} action={<TextLink href="/mobile/plans">{Locale.label("mobile.dashboard.allPlans")}</TextLink>}>
      <RowList>
        {rows.map((a) => {
          const unconfirmed = isStatus(a, "unconfirmed");
          return (
            <Box key={a.assignmentId} data-testid="home-serving-row">
              <Row
                href={`/mobile/plans/${a.planId}`}
                title={DateHelper.prettyDate(DateHelper.toDate(a.serviceDate))}
                subtitle={[a.planName, a.positionName].filter(Boolean).join(" · ")}
                trailing={unconfirmed
                  ? <StatusBadge tone="warn">{Locale.label("mobile.serving.needsReplyBadge")}</StatusBadge>
                  : <StatusBadge tone="ok" dot>{Locale.label(isStatus(a, "accepted") ? "mobile.details.accepted" : "mobile.details.confirmed")}</StatusBadge>}
              />
              {unconfirmed && (
                <Box sx={{ display: "flex", gap: "8px", pb: "8px" }}>
                  <Button size="small" variant="contained" disabled={!!busyId} onClick={() => respond(a, "accept")}>{Locale.label("mobile.details.accept")}</Button>
                  <Button size="small" variant="outlined" disabled={!!busyId} onClick={() => setDeclineTarget(a)}>{Locale.label("mobile.details.decline")}</Button>
                </Box>
              )}
            </Box>
          );
        })}
      </RowList>
      {error && <Typography sx={{ color: mobileTheme.colors.error, fontSize: 14, mt: "6px" }}>{error}</Typography>}
      <ConfirmDeclineSheet open={!!declineTarget} onClose={() => setDeclineTarget(null)} onConfirm={() => { if (declineTarget) respond(declineTarget, "decline"); }} />
    </PlateSection>
  );
};

export const GroupsTeaser = ({ groups }: { groups: GroupInterface[] }) => (
  <PlateSection title={Locale.label("mobile.dashboard.yourGroups")} action={<TextLink href="/mobile/groups">{Locale.label("mobile.dashboard.allGroups")}</TextLink>}>
    <RowList>
      {groups.slice(0, 3).map((g) => (
        <Row
          key={g.id}
          href={`/mobile/groups/${g.id}`}
          leading={<PersonAvatar name={g.name} src={g.photoUrl || undefined} />}
          title={g.name}
          subtitle={[g.meetingTime?.trim(), g.meetingLocation?.trim()].filter(Boolean).join(" · ") || undefined}
        />
      ))}
    </RowList>
  </PlateSection>
);

export const GivingTeaser = ({ summary }: { summary?: GivingSummary }) => (
  <PlateSection title={Locale.label("mobile.dashboard.giving")} action={<TextLink href="/mobile/donate?view=history">{Locale.label("mobile.dashboard.history")}</TextLink>}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
      <Box data-testid="home-giving-total">
        <BigNumber caption={Locale.label("mobile.dashboard.givenIn").replace("{}", String(summary?.year || new Date().getFullYear()))}>
          {summary ? CurrencyHelper.formatCurrencyWithLocale(summary.total || 0, summary.currency) : " "}
        </BigNumber>
      </Box>
      <Button variant="contained" component={Link} href="/mobile/donate?view=give">{Locale.label("mobile.giving.give")}</Button>
    </Box>
  </PlateSection>
);
