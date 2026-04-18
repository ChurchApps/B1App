"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@mui/material";
import { UserHelper } from "@churchapps/apphelper";
import { Person } from "@/components/member/directory/Person";

interface Props {
  personId: string;
  onBack: () => void;
  onSelect: (id: string) => void;
}

export function DirectoryDetailPanel({ personId, onBack, onSelect }: Props) {
  if (!UserHelper.user?.firstName) {
    return (
      <div style={{ padding: 20 }}>
        <h3>Please <Link href={`/login/?returnUrl=/my/community`}>Login</Link> to view directory.</h3>
      </div>
    );
  }

  if (!personId || personId === "undefined" || personId.trim() === "") {
    return (
      <div style={{ padding: 20 }}>
        <p>Invalid person ID.</p>
      </div>
    );
  }

  return (
    <>
      <button className="detailBackBtn" onClick={onBack}>
        <Icon sx={{ fontSize: 20 }}>arrow_back</Icon>
        Back to directory
      </button>
      <Person personId={personId} backHandler={onBack} selectedHandler={onSelect} />
    </>
  );
}
