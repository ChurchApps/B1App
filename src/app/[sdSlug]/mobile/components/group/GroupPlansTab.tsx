"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Skeleton } from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import type { PlanInterface } from "@churchapps/helpers";
import { useQuery } from "@tanstack/react-query";
import { FilterPills, PlateSection, QuietEmpty, Row, RowList, ViewToggle } from "../kit";

interface Props {
  groupId: string;
}

interface PlanTypeRef {
  id?: string;
  name?: string;
}

type PlanWithType = PlanInterface & { planTypeId?: string };

export const GroupPlansTab: React.FC<Props> = ({ groupId }) => {
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
      const d = DateHelper.toDate(p.serviceDate as any);
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
      <PlateSection>
        {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={52} sx={{ mb: "8px" }} />)}
      </PlateSection>
    );
  }

  if (plans.length === 0) {
    return <PlateSection><QuietEmpty>{Locale.label("groupsPage.noPlans")}</QuietEmpty></PlateSection>;
  }

  return (
    <PlateSection>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "14px", mb: "8px" }}>
        <ViewToggle
          label={Locale.label("groupsPage.plans")}
          value={view}
          onChange={setView}
          options={[
            { value: "upcoming", label: Locale.label("groupsPage.upcoming") },
            { value: "past", label: Locale.label("groupsPage.past") }
          ]}
        />
        {planTypeIds.length > 1 && (
          <FilterPills
            label={Locale.label("groupsPage.planType")}
            value={selectedPlanTypeId}
            onChange={setSelectedPlanTypeId}
            options={planTypeIds.map((id) => ({ value: id, label: planTypeName(id) || id }))}
          />
        )}
      </Box>
      {visiblePlans.length === 0 ? (
        <QuietEmpty>{view === "upcoming" ? Locale.label("groupsPage.noUpcomingPlans") : Locale.label("groupsPage.noPastPlans")}</QuietEmpty>
      ) : (
        <RowList>
          {visiblePlans.map((plan) => (
            <Row
              key={plan.id}
              href={`/mobile/plans/${plan.id}`}
              title={plan.name}
              subtitle={plan.serviceDate ? DateHelper.prettyDate(DateHelper.toDate(plan.serviceDate as any)) : undefined}
              chevron
            />
          ))}
        </RowList>
      )}
    </PlateSection>
  );
};
