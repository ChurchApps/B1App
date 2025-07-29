"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Grid } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { ArrayHelper } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import type { AssignmentInterface, PlanInterface, PositionInterface, TimeInterface } from "@churchapps/helpers";
import { ServingTimes } from "@/components/plans/ServingTimes";
import { UpcomingDates } from "@/components/plans/UpcomingDates";
import { BlockoutDates } from "@/components/plans/BlockoutDates";

export function PlansPage() {
  const [assignments, setAssignments] = useState<AssignmentInterface[]>([]);
  const [positions, setPositions] = useState<PositionInterface[]>([]);
  const [plans, setPlans] = useState<PlanInterface[]>([]);
  const [times, setTimes] = useState<TimeInterface[]>([]);

  const loadData = async () => {
    const tempAssignments: AssignmentInterface[] = await ApiHelper.get("/assignments/my", "DoingApi");

    if (tempAssignments.length > 0) {
      setAssignments(tempAssignments);
      const positionIds = ArrayHelper.getUniqueValues(tempAssignments, "positionId");
      const tempPositions = await ApiHelper.get("/positions/ids?ids=" + positionIds, "DoingApi");
      if (tempPositions.length > 0) {
        setPositions(tempPositions);
        const planIds = ArrayHelper.getUniqueValues(tempPositions, "planId");
        ApiHelper.get("/plans/ids?ids=" + planIds, "DoingApi").then((data: any) => setPlans(data));
        ApiHelper.get("/times/plans?planIds=" + planIds, "DoingApi").then((data: any) => setTimes(data));
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!UserHelper.currentUserChurch?.person?.id) {
    return (
      <>
        <h1>Plans</h1>
        <h3 className="text-center w-100">
          Please <Link href="/login/?returnUrl=/my/plans">Login</Link> to view your plans.
        </h3>
      </>
    );
  }

  return (
    <>
      <h1>My Plans</h1>
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ md: 8, xs: 12 }}>
          <ServingTimes assignments={assignments} plans={plans} positions={positions} />
        </Grid>
        <Grid size={{ md: 4, xs: 12 }}>
          <UpcomingDates assignments={assignments} plans={plans} positions={positions} times={times} />
          <BlockoutDates />
        </Grid>
      </Grid>
    </>
  );
}
