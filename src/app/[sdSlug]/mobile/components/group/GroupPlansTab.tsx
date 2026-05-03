"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, FormControl, Icon, InputLabel, MenuItem, Select, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import type { PlanInterface } from "@churchapps/helpers";
import { useQuery } from "@tanstack/react-query";
import { mobileTheme } from "../mobileTheme";

interface Props {
  groupId: string;
}

interface PlanTypeRef {
  id?: string;
  name?: string;
}

type PlanWithType = PlanInterface & { planTypeId?: string };

export const GroupPlansTab: React.FC<Props> = ({ groupId }) => {
  const tc = mobileTheme.colors;
  const [selectedPlanTypeId, setSelectedPlanTypeId] = useState<string>("");
  const [view, setView] = useState<"upcoming" | "past">("upcoming");

  const { data: plans = [], isLoading } = useQuery<PlanWithType[]>({
    queryKey: ["group-plans", groupId],
    queryFn: async () => {
      const data = await ApiHelper.get(`/groups/${groupId}/plans`, "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId,
    placeholderData: []
  });

  const planTypeIds = useMemo(() => {
    const ids = Array.from(new Set(plans.map((p) => p.planTypeId).filter(Boolean) as string[]));
    return ids.sort();
  }, [plans]);

  const planTypeIdsKey = planTypeIds.join(",");

  const { data: planTypes = [] } = useQuery<PlanTypeRef[]>({
    queryKey: ["plan-types", planTypeIdsKey],
    queryFn: async () => {
      if (!planTypeIdsKey) return [];
      const data = await ApiHelper.get(`/planTypes/ids?ids=${encodeURIComponent(planTypeIdsKey)}`, "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: planTypeIds.length > 0,
    placeholderData: []
  });

  useEffect(() => {
    if (planTypeIds.length === 0) {
      if (selectedPlanTypeId !== "") setSelectedPlanTypeId("");
      return;
    }
    if (!selectedPlanTypeId || !planTypeIds.includes(selectedPlanTypeId)) {
      setSelectedPlanTypeId(planTypeIds[0]);
    }
  }, [planTypeIdsKey]);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const visiblePlans = useMemo(() => {
    let filtered = plans;
    if (planTypeIds.length > 1 && selectedPlanTypeId) {
      filtered = filtered.filter((p) => p.planTypeId === selectedPlanTypeId);
    }
    const upcoming: PlanWithType[] = [];
    const past: PlanWithType[] = [];
    filtered.forEach((p) => {
      if (!p.serviceDate) return;
      const d = new Date(p.serviceDate as any);
      if (d >= startOfToday) upcoming.push(p);
      else past.push(p);
    });
    if (view === "upcoming") {
      upcoming.sort((a, b) => new Date(a.serviceDate as any).getTime() - new Date(b.serviceDate as any).getTime());
      return upcoming;
    }
    past.sort((a, b) => new Date(b.serviceDate as any).getTime() - new Date(a.serviceDate as any).getTime());
    return past;
  }, [plans, planTypeIds, selectedPlanTypeId, view, startOfToday]);

  const planTypeName = (id?: string) => planTypes.find((pt) => pt.id === id)?.name || "";

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={64} />
        ))}
      </Box>
    );
  }

  if (plans.length === 0) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.lg}px`, textAlign: "center", color: tc.textSecondary }}>
        <Typography variant="body2">{Locale.label("groupsPage.noPlans")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", mb: `${mobileTheme.spacing.sm}px` }}>
        {planTypeIds.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="group-plan-type-select-label">{Locale.label("groupsPage.planType")}</InputLabel>
            <Select
              labelId="group-plan-type-select-label"
              value={selectedPlanTypeId}
              label={Locale.label("groupsPage.planType")}
              onChange={(e) => setSelectedPlanTypeId(String(e.target.value))}
            >
              {planTypeIds.map((id) => (
                <MenuItem key={id} value={id}>{planTypeName(id) || id}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_, v) => { if (v) setView(v); }}
        >
          <ToggleButton value="upcoming">{Locale.label("groupsPage.upcoming")}</ToggleButton>
          <ToggleButton value="past">{Locale.label("groupsPage.past")}</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {visiblePlans.length === 0 ? (
        <Box sx={{ p: `${mobileTheme.spacing.lg}px`, textAlign: "center", color: tc.textSecondary }}>
          <Typography variant="body2">
            {view === "upcoming"
              ? Locale.label("groupsPage.noUpcomingPlans")
              : Locale.label("groupsPage.noPastPlans")}
          </Typography>
        </Box>
      ) : (
        visiblePlans.map((plan) => (
          <Box
            key={plan.id}
            component={Link}
            href={`/mobile/plans/${plan.id}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: `${mobileTheme.spacing.md}px`,
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              boxShadow: mobileTheme.shadows.sm,
              p: `${mobileTheme.spacing.md}px`,
              textDecoration: "none",
              color: "inherit"
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "20px",
                bgcolor: tc.primaryLight,
                color: tc.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Icon sx={{ fontSize: 22 }}>event_note</Icon>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, color: tc.text }} noWrap>
                {plan.name}
              </Typography>
              {plan.serviceDate && (
                <Typography variant="body2" sx={{ color: tc.textSecondary }}>
                  {DateHelper.formatHtml5Date(new Date(plan.serviceDate as any))}
                </Typography>
              )}
            </Box>
            <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>
          </Box>
        ))
      )}
    </Box>
  );
};
