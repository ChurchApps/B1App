"use client";

import React from "react";
import Link from "next/link";
import { UserHelper } from "@churchapps/apphelper";
import { MasterDetailLayout } from "./MasterDetailLayout";
import { DirectoryMasterPanel } from "./DirectoryMasterPanel";
import { DirectoryDetailPanel } from "./DirectoryDetailPanel";

export function DirectoryPage() {
  if (!UserHelper.user?.firstName) {
    return (
      <div style={{ padding: "24px 32px" }}>
        <h1>Member Directory</h1>
        <h3 className="text-center w-100">
          Please <Link href="/login/?returnUrl=/my/community" data-testid="directory-login-link">Login</Link> to view Directory.
        </h3>
      </div>
    );
  }

  return (
    <MasterDetailLayout
      emptyDetailMessage="Select a member to view their profile"
      masterContent={({ selectedId, onSelect }) => (
        <DirectoryMasterPanel selectedId={selectedId} onSelect={onSelect} />
      )}
      detailContent={({ selectedId, onBack, onSelect }) => (
        <DirectoryDetailPanel personId={selectedId} onBack={onBack} onSelect={onSelect} />
      )}
    />
  );
}
