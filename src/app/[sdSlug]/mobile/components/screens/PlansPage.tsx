"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Skeleton, Typography } from "@mui/material";
import { ApiHelper, ArrayHelper, DateHelper, UserHelper } from "@churchapps/apphelper";
import type {
  AssignmentInterface,
  PlanInterface,
  PositionInterface,
  TimeInterface,
} from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

interface PlanRow {
  planId: string;
  planName: string;
  serviceDate: Date;
  position: string;
  status: string;
  assignmentCount: number;
}

export const PlansPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();

  const [rows, setRows] = useState<PlanRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!UserHelper.user?.firstName) {
      setRows([]);
      return;
    }
    const load = async () => {
      try {
        const assignments: AssignmentInterface[] = await ApiHelper.get("/assignments/my", "DoingApi");
        if (!assignments || assignments.length === 0) {
          if (!cancelled) setRows([]);
          return;
        }
        const positionIds = ArrayHelper.getUniqueValues(assignments, "positionId");
        const positions: PositionInterface[] = await ApiHelper.get(
          "/positions/ids?ids=" + positionIds,
          "DoingApi"
        );
        const planIds = ArrayHelper.getUniqueValues(positions, "planId");
        const [plans, _times]: [PlanInterface[], TimeInterface[]] = await Promise.all([
          ApiHelper.get("/plans/ids?ids=" + planIds, "DoingApi"),
          ApiHelper.get("/times/plans?planIds=" + planIds, "DoingApi"),
        ]);

        const data: PlanRow[] = [];
        assignments.forEach((a) => {
          const position = positions.find((p) => p.id === a.positionId);
          const plan = plans.find((p) => p.id === position?.planId);
          if (position && plan) {
            const existing = data.find((d) => d.planId === plan.id);
            if (existing) {
              existing.assignmentCount += 1;
            } else {
              data.push({
                planId: plan.id,
                planName: plan.name,
                serviceDate: DateHelper.toDate(plan.serviceDate),
                position: position.name,
                status: a.status || "Unconfirmed",
                assignmentCount: 1,
              });
            }
          }
        });
        ArrayHelper.sortBy(data, "serviceDate", true);
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setRows([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const getStatusColor = (status: string) => {
    if (status === "Accepted") return tc.success;
    if (status === "Declined") return tc.error;
    return tc.warning;
  };

  const renderCard = (row: PlanRow) => (
    <Box
      key={row.planId}
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
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        px: `${mobileTheme.spacing.md}px`,
        py: "14px",
        cursor: "pointer",
        transition: "box-shadow 150ms ease, transform 150ms ease",
        "&:hover": { boxShadow: mobileTheme.shadows.md },
        "&:active": { transform: "scale(0.995)" },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: `${mobileTheme.radius.md}px`,
          bgcolor: tc.primaryLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ color: tc.primary }}>event_note</Icon>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 600,
            color: tc.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.planName}
        </Typography>
        <Typography sx={{ fontSize: 14, color: tc.textSecondary }}>
          {DateHelper.prettyDate(row.serviceDate)} &middot; {row.position}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: "999px",
            bgcolor: `${getStatusColor(row.status)}1A`,
            color: getStatusColor(row.status),
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {row.assignmentCount > 1 ? `${row.assignmentCount} assignments` : "You're assigned"}
        </Box>
        <Icon sx={{ color: tc.textSecondary, fontSize: 20 }}>chevron_right</Icon>
      </Box>
    </Box>
  );

  const renderSkeleton = (key: number) => (
    <Box
      key={`sk-${key}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        px: `${mobileTheme.spacing.md}px`,
        py: "14px",
      }}
    >
      <Skeleton variant="rounded" width={44} height={44} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={14} />
      </Box>
      <Skeleton variant="rounded" width={80} height={18} />
    </Box>
  );

  const renderEmpty = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "32px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.primary }}>event_note</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.5 }}>
        No plans yet
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        Your upcoming serving plans will appear here.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.md}px` }}>
        My Plans
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {rows === null && [0, 1, 2].map(renderSkeleton)}
        {rows !== null && rows.length === 0 && renderEmpty()}
        {rows !== null && rows.length > 0 && rows.map(renderCard)}
      </Box>
    </Box>
  );
};
