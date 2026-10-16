"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Button, Skeleton, Typography } from "@mui/material";
import { ApiHelper, ArrayHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssignmentInterface,
  PlanInterface,
  PositionInterface
} from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { BlockoutDatesSection } from "../plans/BlockoutDatesSection";
import { ConfirmDeclineSheet } from "../ConfirmDeclineSheet";
import { BackVerb, FilterPills, PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, StatusBadge, TextLink, useSliceView, type BadgeTone } from "../kit";

interface Props {
  config: ConfigurationInterface;
}

interface AssignmentRow {
  assignmentId: string;
  planId: string;
  planName: string;
  serviceDate: Date;
  position: string;
  status: string;
}

const normalizeStatus = (s: string | undefined | null) => (s || "").toLowerCase();

const statusBadge = (status: string): { tone: BadgeTone; label: string } => {
  const s = normalizeStatus(status);
  if (s === "accepted") return { tone: "ok", label: Locale.label("mobile.details.accepted") };
  if (s === "confirmed") return { tone: "ok", label: Locale.label("mobile.details.confirmed") };
  if (s === "declined") return { tone: "bad", label: Locale.label("mobile.details.declined") };
  if (s === "pending") return { tone: "warn", label: Locale.label("mobile.details.pendingResponse") };
  return { tone: "warn", label: Locale.label("mobile.serving.needsReplyBadge") };
};

const getStartOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const rowKey = (row: AssignmentRow) => row.assignmentId || `${row.planId}-${row.position}`;

export const PlansPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const queryClient = useQueryClient();
  const loggedIn = !!context?.user?.firstName;
  const [view, setView] = useSliceView();
  const [respondingId, setRespondingId] = useState("");
  const [respondError, setRespondError] = useState("");
  const [declineRow, setDeclineRow] = useState<AssignmentRow | null>(null);

  const assignmentsKey = ["/assignments/my", "DoingApi", context?.user?.id];
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<AssignmentInterface[]>({
    queryKey: assignmentsKey,
    queryFn: async () => {
      const data = await ApiHelper.get("/assignments/my", "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const positionIds = useMemo(
    () => [...ArrayHelper.getUniqueValues(assignments, "positionId")].sort(),
    [assignments]
  );

  const positionIdsKey = positionIds.join(",");

  const { data: positions = [], isLoading: positionsLoading } = useQuery<PositionInterface[]>({
    queryKey: ["/positions/ids", "DoingApi", positionIdsKey],
    queryFn: async () => {
      const data = await ApiHelper.get("/positions/ids?ids=" + positionIdsKey, "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn && assignments.length > 0 && positionIds.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const planIds = useMemo(
    () => [...ArrayHelper.getUniqueValues(positions, "planId")].sort(),
    [positions]
  );

  const planIdsKey = planIds.join(",");

  const { data: plans = [], isLoading: plansLoading } = useQuery<PlanInterface[]>({
    queryKey: ["/plans/ids", "DoingApi", planIdsKey],
    queryFn: async () => {
      const data = await ApiHelper.get("/plans/ids?ids=" + planIdsKey, "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn && positions.length > 0 && planIds.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const isLoading = loggedIn && (assignmentsLoading || positionsLoading || plansLoading);

  const [startOfToday, setStartOfToday] = useState(getStartOfToday);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const next = getStartOfToday();
      setStartOfToday((prev) => (prev.getTime() === next.getTime() ? prev : next));
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const { upcomingRows, pastRows } = useMemo(() => {
    const upcomingRows: AssignmentRow[] = [];
    const pastRows: AssignmentRow[] = [];

    assignments.forEach((a) => {
      const position = positions.find((p) => p.id === a.positionId);
      if (!position) return;
      const plan = plans.find((p) => p.id === position.planId);
      if (!plan || !plan.serviceDate) return;
      const serviceDate = DateHelper.toDate(plan.serviceDate);
      const row: AssignmentRow = {
        assignmentId: a.id || "",
        planId: plan.id as string,
        planName: plan.name || "Untitled plan",
        serviceDate,
        position: position.name || "Position",
        status: a.status || ""
      };
      if (serviceDate >= startOfToday) upcomingRows.push(row);
      else pastRows.push(row);
    });

    upcomingRows.sort((a, b) => a.serviceDate.getTime() - b.serviceDate.getTime());
    pastRows.sort((a, b) => b.serviceDate.getTime() - a.serviceDate.getTime());

    return { upcomingRows, pastRows };
  }, [assignments, positions, plans, startOfToday]);

  const needsReply = upcomingRows.filter((r) => normalizeStatus(r.status) === "unconfirmed");
  const scheduled = upcomingRows.filter((r) => normalizeStatus(r.status) !== "unconfirmed");
  const confirmedCount = upcomingRows.filter((r) => ["confirmed", "accepted"].includes(normalizeStatus(r.status))).length;

  const pastYears = useMemo(
    () => [...new Set(pastRows.map((r) => r.serviceDate.getFullYear()))].sort((a, b) => b - a),
    [pastRows]
  );
  const [pastYear, setPastYear] = useState<number>(0);
  const activePastYear = pastYear || pastYears[0] || 0;
  const thisYear = startOfToday.getFullYear();
  const pastThisYear = pastRows.filter((r) => r.serviceDate.getFullYear() === thisYear);

  const respond = async (row: AssignmentRow, action: "accept" | "decline") => {
    if (!row.assignmentId || respondingId) return;
    setRespondingId(row.assignmentId);
    setRespondError("");
    try {
      await ApiHelper.post(`/assignments/${action}/${row.assignmentId}`, [], "DoingApi");
      await queryClient.invalidateQueries({ queryKey: assignmentsKey });
    } catch (err: any) {
      setRespondError(err?.message || Locale.label("mobile.details.unableToRespond").replace("{}", action));
    } finally {
      setRespondingId("");
    }
  };

  const dateText = (d: Date) => <span data-testid="serving-date">{DateHelper.prettyDate(d)}</span>;

  const renderRow = (row: AssignmentRow, withBadge = true) => {
    const badge = statusBadge(row.status);
    return (
      <Row
        key={rowKey(row)}
        href={`/mobile/plans/${row.planId}`}
        title={dateText(row.serviceDate)}
        subtitle={`${row.planName} · ${row.position}`}
        trailing={withBadge ? <StatusBadge tone={badge.tone} dot={badge.tone === "ok"}>{badge.label}</StatusBadge> : undefined}
      />
    );
  };

  const renderSkeleton = () => (
    <Box>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ py: "10px" }}>
          <Skeleton variant="text" width="45%" height={22} />
          <Skeleton variant="text" width="65%" height={18} />
        </Box>
      ))}
    </Box>
  );

  const renderNeedsReply = (row: AssignmentRow) => {
    const busy = respondingId === row.assignmentId;
    return (
      <Box key={rowKey(row)} sx={{ "& + &": { borderTop: `1px solid ${tc.border}`, pt: "16px", mt: "16px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
          <TextLink href={`/mobile/plans/${row.planId}`} sx={{ display: "block", whiteSpace: "normal", color: tc.text, fontSize: 17, fontWeight: 600 }}>
            {dateText(row.serviceDate)}
            <Typography component="span" sx={{ display: "block", fontSize: 13.5, color: tc.textSecondary, fontWeight: 400 }}>{`${row.planName} · ${row.position}`}</Typography>
          </TextLink>
          <StatusBadge tone="warn">{Locale.label("mobile.serving.needsReplyBadge")}</StatusBadge>
        </Box>
        <Box sx={{ display: "flex", gap: "8px", mt: "14px" }}>
          <Button variant="contained" size="small" disabled={busy} onClick={() => respond(row, "accept")}>{Locale.label("mobile.details.accept")}</Button>
          <Button variant="outlined" size="small" disabled={busy} onClick={() => setDeclineRow(row)}>{Locale.label("mobile.details.decline")}</Button>
        </Box>
      </Box>
    );
  };

  if (view === "past" || view === "upcoming") {
    const isPast = view === "past";
    const rows = isPast
      ? (activePastYear === -1 ? pastRows : pastRows.filter((r) => r.serviceDate.getFullYear() === activePastYear))
      : upcomingRows;
    return (
      <Box>
        <BackVerb label={Locale.label("mobile.serving.backTo").replace("{}", Locale.label("mobile.screenTitles.plans"))} onClick={() => setView("")} />
        <PageHead title={isPast ? Locale.label("mobile.serving.pastAssignments") : Locale.label("mobile.serving.allUpcoming")} />
        <Plate>
          <PlateSection>
            {isPast && pastYears.length > 0 && (
              <Box sx={{ mb: "8px" }}>
                <FilterPills
                  label={Locale.label("mobile.serving.year")}
                  value={activePastYear}
                  onChange={setPastYear}
                  options={[...pastYears.map((y) => ({ value: y, label: String(y) })), { value: -1, label: Locale.label("mobile.serving.allYears") }]}
                />
              </Box>
            )}
            {isLoading ? renderSkeleton() : rows.length === 0 ? (
              <QuietEmpty>{isPast ? Locale.label("mobile.serving.noPast") : Locale.label("mobile.serving.noUpcoming")}</QuietEmpty>
            ) : (
              <RowList>{rows.map((r) => renderRow(r, !isPast || normalizeStatus(r.status) === "declined"))}</RowList>
            )}
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  const ledeParts = [
    Locale.label("mobile.serving.confirmedCount").replace("{}", String(confirmedCount)),
    needsReply.length > 0 ? Locale.label("mobile.serving.replyCount").replace("{}", String(needsReply.length)) : ""
  ].filter(Boolean);
  const lastServed = pastRows[0];

  return (
    <Box>
      <PageHead title={Locale.label("mobile.screenTitles.plans")} lede={loggedIn && !isLoading ? ledeParts.join(" · ") : undefined}>
        <Button variant="contained" component={Link} href="/mobile/volunteer">{Locale.label("mobile.serving.signUpToServe")}</Button>
      </PageHead>
      <Plate>
        {needsReply.length > 0 && (
          <PlateSection title={Locale.label("mobile.serving.needsReply")}>
            {needsReply.map(renderNeedsReply)}
            {respondError && <Typography role="alert" sx={{ mt: "10px", fontSize: 13.5, color: tc.error }}>{respondError}</Typography>}
            <ConfirmDeclineSheet open={!!declineRow} onClose={() => setDeclineRow(null)} onConfirm={() => { if (declineRow) respond(declineRow, "decline"); }} />
          </PlateSection>
        )}
        <PlateSection
          title={Locale.label("mobile.screens.tabUpcoming")}
          action={upcomingRows.length > 3 ? <TextLink onClick={() => setView("upcoming")}>{Locale.label("mobile.serving.allUpcoming")}</TextLink> : undefined}
        >
          {isLoading ? renderSkeleton() : scheduled.length === 0 ? (
            <QuietEmpty>{Locale.label("mobile.serving.noUpcoming")}</QuietEmpty>
          ) : (
            <RowList>{scheduled.slice(0, 3).map((r) => renderRow(r))}</RowList>
          )}
        </PlateSection>
        {loggedIn && <BlockoutDatesSection enabled={loggedIn} />}
        <PlateSection
          title={Locale.label("mobile.screens.tabPast")}
          action={<TextLink onClick={() => setView("past")}>{Locale.label("mobile.serving.pastAssignments")}</TextLink>}
        >
          {lastServed ? (
            <Typography sx={{ fontSize: 14, color: tc.textSecondary }}>
              {Locale.label("mobile.serving.timesInYear").replace("{}", String(pastThisYear.length)).replace("{}", String(thisYear))}
              {" · "}
              {Locale.label("mobile.serving.lastServed").replace("{}", `${DateHelper.prettyDate(lastServed.serviceDate)}, ${lastServed.position}`)}
            </Typography>
          ) : (
            <QuietEmpty>{Locale.label("mobile.serving.noPast")}</QuietEmpty>
          )}
        </PlateSection>
      </Plate>
    </Box>
  );
};
