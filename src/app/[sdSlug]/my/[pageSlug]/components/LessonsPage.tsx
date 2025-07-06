"use client";

import UserContext from "@/context/UserContext";
import { EnvironmentHelper } from "@/helpers";
import React from "react";

export function LessonsPage() {
  const context = React.useContext(UserContext);
  const jwt = context.userChurch?.jwt;
  const churchId = context.userChurch?.church.id;

  return (

    <iframe
      title="content"
      className="full-frame"
      src={EnvironmentHelper.Common.LessonsRoot + "/login?jwt=" + jwt + "&returnUrl=/b1/person&churchId=" + churchId}
    />

  );
}
