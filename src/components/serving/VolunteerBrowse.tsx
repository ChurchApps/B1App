"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, Typography, Stack, Button, LinearProgress, Box, Chip } from "@mui/material";
import { DateHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import type { PlanInterface, PositionInterface, TimeInterface } from "@churchapps/helpers";

interface SignupPlanData {
  plan: PlanInterface;
  positions: (PositionInterface & { filledCount: number })[];
  times: TimeInterface[];
}

interface Props {
  signupPlans: SignupPlanData[];
}

export function VolunteerBrowse({ signupPlans }: Props) {
  if (signupPlans.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h5" gutterBottom>{Locale.label("serving.opportunities")}</Typography>
        <Typography color="text.secondary">{Locale.label("serving.noOpportunities")}</Typography>
      </Box>
    );
  }

  const getTotalSlots = (positions: SignupPlanData["positions"]) => {
    const total = positions.reduce((sum, p) => sum + (p.count || 0), 0);
    const filled = positions.reduce((sum, p) => sum + p.filledCount, 0);
    return { total, filled, remaining: total - filled };
  };

  return (
    <>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>{Locale.label("serving.opportunities")}</Typography>
      <Stack spacing={3}>
        {signupPlans.map(({ plan, positions, times }) => {
          const { total, filled, remaining } = getTotalSlots(positions);
          const progress = total > 0 ? (filled / total) * 100 : 0;

          return (
            <Card key={plan.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{plan.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {DateHelper.prettyDate(new Date(plan.serviceDate))}
                      {times.length > 0 && (" \u00b7 " + times.map(t => t.displayName).join(", "))}
                    </Typography>
                  </Box>
                  <Chip
                    label={remaining > 0 ? Locale.label("serving.spotsOpen").replace("{}", remaining.toString()) : Locale.label("serving.full")}
                    color={remaining > 0 ? "success" : "default"}
                    size="small"
                  />
                </Stack>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    {Locale.label("serving.positionsFilled").replace("{filled}", filled.toString()).replace("{total}", total.toString())}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                  {positions.map(p => (
                    <Chip
                      key={p.id}
                      label={p.name + " (" + Locale.label("serving.openCount").replace("{}", (p.count - p.filledCount).toString()) + ")"}
                      size="small"
                      variant="outlined"
                      color={p.filledCount < p.count ? "primary" : "default"}
                    />
                  ))}
                </Stack>
                {remaining > 0 && (
                  <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Link href={`volunteer/${plan.id}`} passHref>
                      <Button variant="contained" size="small" sx={{ textTransform: "none", borderRadius: 2 }}>
                        {Locale.label("serving.viewAndSignUp")}
                      </Button>
                    </Link>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </>
  );
}
