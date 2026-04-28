"use client";

import React, { useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import { ApiHelper, ArrayHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type {
  AssignmentInterface,
  PlanInterface,
  PositionInterface
} from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { BlockoutDatesSection } from "../plans/BlockoutDatesSection";
import { shadePrimary } from "../util";

interface Props {
  config: ConfigurationInterface;
}

type TabKey = "upcoming" | "past";

interface AssignmentRow {
  assignmentId: string;
  planId: string;
  planName: string;
  serviceDate: Date;
  position: string;
  status: string;
}

const normalizeStatus = (s: string | undefined | null) => (s || "").toLowerCase();

const getStatusMeta = (status: string, tc: typeof mobileTheme.colors) => {
  const s = normalizeStatus(status);
  if (s === "accepted") return { color: tc.success, label: "Accepted" };
  if (s === "confirmed") return { color: tc.success, label: "Confirmed" };
  if (s === "declined") return { color: tc.error, label: "Declined" };
  if (s === "pending") return { color: tc.warning, label: "Pending Response" };
  if (!s || s === "unconfirmed") return { color: tc.disabled, label: "Unconfirmed" };
  return { color: tc.disabled, label: status };
};

export const PlansPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;
  const [tab, setTab] = useState<TabKey>("upcoming");

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<AssignmentInterface[]>({
    queryKey: ["/assignments/my", "DoingApi", context?.user?.id],
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

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { upcomingRows, pastRows, upcomingAssignments } = useMemo(() => {
    const upcomingRows: AssignmentRow[] = [];
    const pastRows: AssignmentRow[] = [];
    const upcomingAssignments: AssignmentInterface[] = [];

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
      if (serviceDate >= startOfToday) {
        upcomingRows.push(row);
        upcomingAssignments.push(a);
      } else {
        pastRows.push(row);
      }
    });

    upcomingRows.sort((a, b) => a.serviceDate.getTime() - b.serviceDate.getTime());
    pastRows.sort((a, b) => b.serviceDate.getTime() - a.serviceDate.getTime());

    return { upcomingRows, pastRows, upcomingAssignments };
  }, [assignments, positions, plans, startOfToday]);

  const stats = useMemo(() => {
    const requested = upcomingAssignments.length;
    const confirmed = upcomingAssignments.filter((a) => {
      const s = normalizeStatus(a.status);
      return s === "confirmed" || s === "accepted";
    }).length;
    const pending = upcomingAssignments.filter((a) => {
      const s = normalizeStatus(a.status);
      return !s || s === "unconfirmed" || s === "pending";
    }).length;
    const nextRow = upcomingRows[0];
    return { requested, confirmed, pending, nextRow };
  }, [upcomingAssignments, upcomingRows]);

  const renderHero = () => {
    const gradientFrom = shadePrimary(tc.primary, -12);
    const gradientTo = shadePrimary(tc.primary, 18);
    return (
      <Box
        sx={{
          borderRadius: `${mobileTheme.radius.xl}px`,
          overflow: "hidden",
          mb: `${mobileTheme.spacing.lg}px`,
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          p: `${mobileTheme.spacing.lg}px`,
          minHeight: 180,
          color: "#FFFFFF",
          textAlign: "center",
          boxShadow: mobileTheme.shadows.md,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {isLoading ? (
          <Box sx={{ py: 2, width: "100%" }}>
            <Skeleton variant="rounded" height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto", width: "60%", mb: 1 }} />
            <Skeleton variant="rounded" height={18} sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto", width: "40%" }} />
          </Box>
        ) : (
          <Box sx={{ width: "100%" }}>
            <Icon sx={{ fontSize: 48, mb: 1.5 }}>assignment</Icon>
            <Typography sx={{ fontSize: 24, fontWeight: 700, mb: 1 }}>
              Your serving schedule
            </Typography>
            <Typography sx={{ fontSize: 16, opacity: 0.9, mb: stats.nextRow ? 2 : 0 }}>
              {stats.confirmed} confirmed &middot; {stats.pending} pending
            </Typography>
            {stats.nextRow && (
              <Box
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  borderRadius: `${mobileTheme.radius.lg}px`,
                  px: 2,
                  py: 1.25,
                  display: "inline-block",
                  minWidth: 180
                }}
              >
                <Typography sx={{ fontSize: 14, opacity: 0.8, mb: 0.5 }}>{Locale.label("mobile.screens.nextService")}</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
                  {DateHelper.prettyDate(stats.nextRow.serviceDate)}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const renderStatCard = (
    iconName: string,
    iconColor: string,
    value: number,
    label: string
  ) => (
    <Box
      sx={{
        flex: 1,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`,
        textAlign: "center"
      }}
    >
      <Icon sx={{ fontSize: 32, color: iconColor }}>{iconName}</Icon>
      {isLoading ? (
        <>
          <Skeleton variant="text" width="40%" height={28} sx={{ mx: "auto", mt: 1 }} />
          <Skeleton variant="text" width="60%" height={14} sx={{ mx: "auto" }} />
        </>
      ) : (
        <>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: tc.text, mt: 1, mb: 0.5 }}>
            {value}
          </Typography>
          <Typography sx={{ fontSize: 12, color: tc.textMuted, fontWeight: 500 }}>
            {label}
          </Typography>
        </>
      )}
    </Box>
  );

  const renderStats = () => (
    <Box sx={{ display: "flex", gap: "12px", mb: `${mobileTheme.spacing.lg}px` }}>
      {renderStatCard("assignment", "#2196F3", stats.requested, "Requested")}
      {renderStatCard("event_available", tc.success, stats.confirmed, "Confirmed")}
      {renderStatCard("schedule", tc.warning, stats.pending, "Pending")}
    </Box>
  );

  const renderAssignmentRow = (row: AssignmentRow) => {
    const meta = getStatusMeta(row.status, tc);
    return (
      <Box
        key={row.assignmentId || `${row.planId}-${row.position}`}
        onClick={() => router.push(`/mobile/plans/${row.planId}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(`/mobile/plans/${row.planId}`);
          }
        }}
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.xl}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          cursor: "pointer",
          transition: "box-shadow 150ms ease, transform 150ms ease",
          "&:hover": { boxShadow: mobileTheme.shadows.md },
          "&:active": { transform: "scale(0.995)" }
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0, mr: 1.5 }}>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 700,
                color: tc.text,
                mb: 0.75,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {row.planName}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Icon sx={{ fontSize: 16, color: tc.primary, mr: 0.75 }}>event</Icon>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: tc.textMuted }}>
                {DateHelper.prettyDate(row.serviceDate)}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: "16px",
              bgcolor: meta.color,
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              minWidth: 80,
              textAlign: "center",
              whiteSpace: "nowrap"
            }}
          >
            {meta.label}
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: `${tc.primary}14`,
            px: 1.5,
            py: 1,
            borderRadius: `${mobileTheme.radius.lg}px`
          }}
        >
          <Icon sx={{ fontSize: 18, color: tc.primary, mr: 0.75 }}>assignment_ind</Icon>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.primary }}>
            {row.position}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderSkeletonRow = (key: number) => (
    <Box
      key={`sk-${key}`}
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box sx={{ flex: 1, mr: 1.5 }}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="45%" height={18} />
        </Box>
        <Skeleton variant="rounded" width={80} height={28} />
      </Box>
      <Skeleton variant="rounded" width="60%" height={32} />
    </Box>
  );

  const renderServingList = (rows: AssignmentRow[], emptyMessage: string, emptySubtext: string) => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`
      }}
    >
      {isLoading && rows.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[0, 1, 2].map(renderSkeletonRow)}
        </Box>
      ) : rows.length === 0 ? (
        renderEmptyInline(emptyMessage, emptySubtext)
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rows.map(renderAssignmentRow)}
        </Box>
      )}
    </Box>
  );

  const renderEmptyInline = (message: string, subtext: string) => (
    <Box sx={{ textAlign: "center", p: `${mobileTheme.spacing.lg}px` }}>
      <Icon sx={{ fontSize: 48, color: tc.disabled }}>event_busy</Icon>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mt: 2 }}>
        {message}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.disabled, mt: 1 }}>
        {subtext}
      </Typography>
    </Box>
  );

  const renderSectionHeader = (iconName: string, title: string) => (
    <Box sx={{ display: "flex", alignItems: "center", mb: `${mobileTheme.spacing.md}px`, pl: 0.5 }}>
      <Icon sx={{ color: tc.primary, mr: 1, fontSize: 24 }}>{iconName}</Icon>
      <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text }}>{title}</Typography>
    </Box>
  );

  const renderBrowseVolunteerCard = () => (
    <Box
      onClick={() => router.push("/mobile/volunteer")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push("/mobile/volunteer");
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        px: `${mobileTheme.spacing.md}px`,
        py: "16px",
        cursor: "pointer",
        transition: "box-shadow 150ms ease",
        "&:hover": { boxShadow: mobileTheme.shadows.md }
      }}
    >
      <Icon sx={{ color: tc.primary, fontSize: 32 }}>volunteer_activism</Icon>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text }}>
          Browse Volunteer
        </Typography>
        <Typography sx={{ fontSize: 13, color: tc.textMuted, mt: 0.25 }}>
          Find new opportunities to serve.
        </Typography>
      </Box>
      <Icon sx={{ color: tc.disabled, fontSize: 24 }}>chevron_right</Icon>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          mb: `${mobileTheme.spacing.md}px`
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v: TabKey) => setTab(v)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 52,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              minHeight: 52,
              color: tc.textSecondary
            },
            "& .Mui-selected": { color: `${tc.primary} !important`, fontWeight: 700 },
            "& .MuiTabs-indicator": { backgroundColor: tc.primary, height: 2 }
          }}
        >
          <Tab value="upcoming" label={Locale.label("mobile.screens.tabUpcoming")} />
          <Tab value="past" label={Locale.label("mobile.screens.tabPast")} />
        </Tabs>
      </Box>

      {tab === "upcoming" && (
        <>
          {renderHero()}
          {renderStats()}
          <Box sx={{ mb: `${mobileTheme.spacing.lg}px` }}>
            {renderSectionHeader("schedule", "Serving Times")}
            {renderServingList(
              upcomingRows,
              "No serving times found",
              "Your upcoming assignments will appear here."
            )}
          </Box>
          {loggedIn && <BlockoutDatesSection enabled={loggedIn} />}
          {renderBrowseVolunteerCard()}
        </>
      )}

      {tab === "past" && (
        <Box sx={{ mb: `${mobileTheme.spacing.lg}px` }}>
          {renderSectionHeader("history", "Past Assignments")}
          {renderServingList(
            pastRows,
            "No past dates found",
            "Your past assignments will appear here."
          )}
        </Box>
      )}
    </Box>
  );
};
