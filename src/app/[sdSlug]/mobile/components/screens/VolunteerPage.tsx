"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Icon, LinearProgress, Skeleton, Typography } from "@mui/material";
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
    queryKey: ["volunteer-signup", churchId],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous("/plans/public/signup/" + churchId, "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!churchId,
  });

  const getSlots = (positions: SignupPlanData["positions"]) => {
    const total = positions.reduce((s, p) => s + (p.count || 0), 0);
    const filled = positions.reduce((s, p) => s + (p.filledCount || 0), 0);
    return { total, filled, remaining: Math.max(0, total - filled) };
  };

  const getDescription = (item: SignupPlanData) => {
    const parts: string[] = [];
    if (item.times?.length) parts.push(item.times.map((t) => t.displayName).filter(Boolean).join(", "));
    if (item.positions?.length) {
      const posNames = item.positions.map((p) => p.name).filter(Boolean).slice(0, 3).join(", ");
      if (posNames) parts.push(posNames);
    }
    return parts.join(" \u00b7 ");
  };

  const renderCard = (item: SignupPlanData) => {
    const { total, filled, remaining } = getSlots(item.positions);
    const progress = total > 0 ? (filled / total) * 100 : 0;
    const description = getDescription(item);
    const isFull = remaining === 0;

    return (
      <Box
        key={item.plan.id}
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 0.25 }}>
              {item.plan.name}
            </Typography>
            <Typography sx={{ fontSize: 13, color: tc.textSecondary }}>
              {DateHelper.prettyDate(DateHelper.toDate(item.plan.serviceDate))}
            </Typography>
            {description && (
              <Typography
                sx={{
                  fontSize: 13,
                  color: tc.textSecondary,
                  mt: 0.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {description}
              </Typography>
            )}
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
              whiteSpace: "nowrap",
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
                "& .MuiLinearProgress-bar": { bgcolor: tc.primary },
              }}
            />
            <Typography sx={{ fontSize: 11, color: tc.textSecondary, mt: 0.5 }}>
              {filled} of {total} positions filled
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            disabled={isFull}
            onClick={() => router.push(`/mobile/volunteer/${item.plan.id}`)}
            sx={{
              bgcolor: tc.primary,
              color: tc.onPrimary,
              borderRadius: `${mobileTheme.radius.md}px`,
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { bgcolor: tc.primary },
            }}
          >
            {isFull ? "Full" : "Volunteer"}
          </Button>
        </Box>
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
        p: `${mobileTheme.spacing.md}px`,
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
        <Icon sx={{ fontSize: 32, color: tc.primary }}>handshake</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.5 }}>
        No opportunities right now
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        Check back soon for new ways to serve.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.md}px` }}>
        Volunteer
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {signupPlans === null && [0, 1].map(renderSkeleton)}
        {signupPlans !== null && signupPlans.length === 0 && renderEmpty()}
        {signupPlans !== null && signupPlans.length > 0 && signupPlans.map(renderCard)}
      </Box>
    </Box>
  );
};
