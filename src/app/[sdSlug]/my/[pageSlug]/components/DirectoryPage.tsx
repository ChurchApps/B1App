"use client";

import React from "react";
import Link from "next/link";
import { DirectorySearch } from "@/components/member/directory/DirectorySearch";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";

export function DirectoryPage() {
  const getContent = () => <DirectorySearch selectedHandler={() => {}} />;

  return (
    <>
      {UserHelper.user?.firstName
        ? (
          getContent()
        )
        : (
          <>
            <h1>Member Directory</h1>
            <h3 className="text-center w-100">
            Please <Link href="/login/?returnUrl=/my/community">Login</Link> to view Directory.
            </h3>
          </>
        )}
    </>
  );
}
