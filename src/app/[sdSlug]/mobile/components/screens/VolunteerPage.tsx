"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Chip, Icon, LinearProgress, Skeleton, Typography } from "@mui/material";
import { ApiHelper, DateHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PlanInterface, PositionInterface, TimeInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

interface SignupPlanData {
  plan: PlanInterface;
  positions: (PositionInterface & { filledCount: number })[];
  times: TimeInterface[];
}

export const VolunteerPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const churchId = config?.church?.id;

  const { data: signupPlans = null } = useQuery<SignupPlanData[]>({
    queryKey: ["/plans/public/signup/" + churchId, "DoingApi-anon"],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous("/plans/public/signup/" + churchId, "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!churchId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const getSlots = (positions: SignupPlanData["positions"]) => {
    const total = positions.reduce((s, p) => s + (p.count || 0), 0);
    const filled = positions.reduce((s, p) => s + (p.filledCount || 0), 0);
    return { total, filled, remaining: Math.max(0, total - filled) };
  };

  const getTimesLabel = (item: SignupPlanData) => {
    if (!item.times?.length) return "";
    return item.times.map((t) => t.displayName).filter(Boolean).join(", ");
  };

  const renderCard = (item: SignupPlanData) => {
    const { total, filled, remaining } = getSlots(item.positions);
    const progress = total > 0 ? (filled / total) * 100 : 0;
    const timesLabel = getTimesLabel(item);
    const isFull = remaining === 0;

    return (
      <Box
        key={item.plan.id}
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 0.25 }}>
              {item.plan.name}
            </Typography>
            <Typography sx={{ fontSize: 13, color: tc.textSecondary }}>
              {DateHelper.prettyDate(DateHelper.toDate(item.plan.serviceDate))}
              {timesLabel ? ` \u00b7 ${timesLabel}` : ""}
            </Typography>
          </Box>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: "999px",
              bgcolor: isFull ? `${tc.textSecondary}1A` : `${tc.success}1A`,
              color: isFull ? tc.textSecondary : tc.success,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}
          >
            {isFull ? "Full" : `${remaining} open`}
          </Box>
        </Box>

        {total > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: tc.border,
                "& .MuiLinearProgress-bar": { bgcolor: tc.primary }
              }}
            />
            <Typography sx={{ fontSize: 11, color: tc.textSecondary, mt: 0.5 }}>
              {filled} of {total} positions filled
            </Typography>
          </Box>
        )}

        {item.positions?.length > 0 && (
          <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {item.positions.map((p) => {
              const posOpen = Math.max(0, (p.count || 0) - (p.filledCount || 0));
              const posFull = posOpen === 0;
              return (
                <Chip
                  key={p.id || p.name}
                  label={`${p.name} (${posOpen} open)`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 500,
                    bgcolor: posFull ? `${tc.textSecondary}1A` : tc.primaryLight,
                    color: posFull ? tc.textSecondary : tc.primary,
                    "& .MuiChip-label": { px: 1 }
                  }}
                />
              );
            })}
          </Box>
        )}

        {!isFull && (
          <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={() => router.push(`/mobile/volunteer/${item.plan.id}`)}
              sx={{
                bgcolor: tc.primary,
                color: tc.onPrimary,
                borderRadius: `${mobileTheme.radius.md}px`,
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { bgcolor: tc.primary }
              }}
            >
              View & Sign Up
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  const renderSkeleton = (i: number) => (
    <Box
      key={`sk-${i}`}
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`
      }}
    >
      <Skeleton variant="text" width="60%" height={22} />
      <Skeleton variant="text" width="40%" height={14} />
      <Skeleton variant="rounded" height={6} sx={{ mt: 1.5 }} />
      <Skeleton variant="rounded" width={110} height={32} sx={{ mt: 1.5, ml: "auto" }} />
    </Box>
  );

  const renderEmpty = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
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
          mb: `${mobileTheme.spacing.md}px`
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.primary }}>volunteer_activism</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.5 }}>
        Browse Opportunities
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        There are no volunteer opportunities available right now. Check back soon!
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {signupPlans === null && [0, 1].map(renderSkeleton)}
        {signupPlans !== null && signupPlans.length === 0 && renderEmpty()}
        {signupPlans !== null && signupPlans.length > 0 && signupPlans.map(renderCard)}
      </Box>
    </Box>
  );
};
