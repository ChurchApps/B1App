"use client";

import React from "react";
import Link from "next/link";
import { Box, Typography, Skeleton, Icon } from "@mui/material";
import { ApiHelper, Locale, DateHelper } from "@churchapps/apphelper";
import type { PlanInterface } from "@churchapps/helpers";
import { useQuery } from "@tanstack/react-query";
import { mobileTheme } from "../mobileTheme";

interface Props {
  groupId: string;
}

export const GroupPlansTab: React.FC<Props> = ({ groupId }) => {
  const tc = mobileTheme.colors;
  const { data: plans = [], isLoading } = useQuery<PlanInterface[]>({
    queryKey: ["group-plans", groupId],
    queryFn: async () => {
      const data = await ApiHelper.get(`/plans/group/${groupId}`, "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId,
    placeholderData: []
  });

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
      {plans.map((plan) => (
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
      ))}
    </Box>
  );
};
