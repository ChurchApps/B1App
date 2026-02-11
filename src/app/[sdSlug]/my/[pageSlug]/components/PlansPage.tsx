"use client";

import Link from "next/link";
import { UserHelper } from "@churchapps/apphelper";
import { MasterDetailLayout } from "./MasterDetailLayout";
import { PlansMasterPanel } from "./PlansMasterPanel";
import { PlansDetailPanel } from "./PlansDetailPanel";

export function PlansPage() {
  if (!UserHelper.currentUserChurch?.person?.id) {
    return (
      <div style={{ padding: "24px 32px" }}>
        <h1>Plans</h1>
        <h3 className="text-center w-100">
          Please <Link href="/login/?returnUrl=/my/plans" data-testid="plans-login-link">Login</Link> to view your plans.
        </h3>
      </div>
    );
  }

  return (
    <MasterDetailLayout
      emptyDetailMessage="Select a plan to view details"
      masterContent={({ selectedId, onSelect }) => (
        <PlansMasterPanel selectedId={selectedId} onSelect={onSelect} />
      )}
      detailContent={({ selectedId, onBack }) => (
        <PlansDetailPanel planId={selectedId} onBack={onBack} />
      )}
    />
  );
}
