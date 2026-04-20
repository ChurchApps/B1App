"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@mui/material";
import { UserHelper } from "@churchapps/apphelper";
import { PlanClient } from "./PlanClient";
import { BlockoutDates } from "@/components/plans/BlockoutDates";

interface Props {
  planId: string;
  onBack: () => void;
}

export function PlansDetailPanel({ planId, onBack }: Props) {
  if (!UserHelper.currentUserChurch?.person?.id) {
    return (
      <div style={{ padding: 20 }}>
        <h3>Please <Link href="/login/?returnUrl=/my/plans">Login</Link> to view your plans.</h3>
      </div>
    );
  }

  return (
    <>
      <button className="detailBackBtn" onClick={onBack}>
        <Icon sx={{ fontSize: 20 }}>arrow_back</Icon>
        Back to plans
      </button>
      {planId === "blockout" ? <BlockoutDates /> : <PlanClient planId={planId} />}
    </>
  );
}
