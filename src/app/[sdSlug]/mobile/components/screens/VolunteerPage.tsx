"use client";

import React, { useState } from "react";
import { Box, Skeleton } from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PlanInterface, PositionInterface, TimeInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { LoadErrorAlert } from "../LoadErrorAlert";
import { FilterPills, PageHead, Plate, PlateSection, QuietEmpty, Row, RowList } from "../kit";

interface Props {
  config: ConfigurationInterface;
}

interface SignupPlanData {
  plan: PlanInterface & { signupDeadlineHours?: number; showVolunteerNames?: boolean };
  positions: (PositionInterface & { filledCount: number })[];
  times: TimeInterface[];
}

type Filter = "all" | "open";

const tc = mobileTheme.colors;

const getSlots = (positions: SignupPlanData["positions"]) => {
  const total = positions.reduce((s, p) => s + (p.count || 0), 0);
  const filled = positions.reduce((s, p) => s + (p.filledCount || 0), 0);
  return { total, filled, remaining: Math.max(0, total - filled) };
};

export const VolunteerPage = ({ config }: Props) => {
  const churchId = config?.church?.id;
  const [filter, setFilter] = useState<Filter>("all");

  const { data: signupPlans = null, isError: signupPlansError, refetch: refetchSignupPlans } = useQuery<SignupPlanData[]>({
    queryKey: ["/plans/public/signup/" + churchId, "DoingApi-anon"],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous("/plans/public/signup/" + churchId, "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!churchId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const visible = (signupPlans || []).filter((item) => filter === "all" || getSlots(item.positions || []).remaining > 0);

  const renderRow = (item: SignupPlanData) => {
    const { total, filled, remaining } = getSlots(item.positions || []);
    const timesLabel = (item.times || []).map((t) => t.displayName).filter(Boolean).join(", ");
    const positionNames = (item.positions || []).map((p) => p.name).filter(Boolean).join(", ");
    return (
      <Row
        key={item.plan.id}
        href={`/mobile/volunteer/${item.plan.id}`}
        chevron
        sx={{ py: "14px" }}
        title={item.plan.name}
        subtitle={<>
          {DateHelper.prettyDate(DateHelper.toDate(item.plan.serviceDate))}
          {timesLabel ? ` · ${timesLabel}` : ""}
          {positionNames && <Box component="span" sx={{ display: "block" }}>{positionNames}</Box>}
          {total > 0 && (
            <Box component="span" sx={{ display: "flex", alignItems: "center", gap: "10px", mt: "8px" }}>
              <Box component="span" aria-hidden sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: tc.border, overflow: "hidden" }}>
                <Box component="span" sx={{ display: "block", height: "100%", width: `${(filled / total) * 100}%`, bgcolor: tc.primary }} />
              </Box>
              <Box component="span" sx={{ flex: "none" }}>
                {remaining === 0
                  ? Locale.label("mobile.screens.volunteerFull")
                  : Locale.label("mobile.serving.openOf").replace("{}", String(remaining)).replace("{}", String(total))}
              </Box>
            </Box>
          )}
        </>}
      />
    );
  };

  const renderBody = () => {
    if (signupPlans === null && signupPlansError) return <LoadErrorAlert onRetry={() => refetchSignupPlans()} />;
    if (signupPlans === null) {
      return [0, 1].map((i) => (
        <Box key={i} sx={{ py: "12px" }}>
          <Skeleton variant="text" width="60%" height={22} />
          <Skeleton variant="text" width="40%" height={18} />
          <Skeleton variant="rounded" height={4} sx={{ mt: 1 }} />
        </Box>
      ));
    }
    if (signupPlans.length === 0) return <QuietEmpty>{Locale.label("mobile.screens.volunteerBrowseBody")}</QuietEmpty>;
    if (visible.length === 0) return <QuietEmpty>{Locale.label("mobile.serving.noOpenSpots")}</QuietEmpty>;
    return <RowList>{visible.map(renderRow)}</RowList>;
  };

  return (
    <Box>
      <PageHead
        title={Locale.label("mobile.screenTitles.volunteer")}
        lede={config?.church?.name ? Locale.label("mobile.serving.volunteerLede").replace("{}", config.church.name) : undefined}
      >
        <FilterPills
          label={Locale.label("mobile.serving.volunteerFilter")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: Locale.label("mobile.serving.allFilter") },
            { value: "open", label: Locale.label("mobile.serving.openSpots") }
          ]}
        />
      </PageHead>
      <Plate>
        <PlateSection sx={{ py: { xs: "6px", md: "8px" } }}>
          {renderBody()}
        </PlateSection>
      </Plate>
    </Box>
  );
};
