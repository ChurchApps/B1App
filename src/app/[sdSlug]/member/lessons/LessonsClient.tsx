"use client";

import { Wrapper } from "@/components";
import UserContext from "@/context/UserContext";
import { EnvironmentHelper, WrapperPageProps } from "@/helpers";
import React from "react";

export function LessonsClient(props: WrapperPageProps) {
  const context = React.useContext(UserContext);
  const jwt = context.userChurch?.jwt;
  const churchId = context.userChurch?.church.id;

  return (
    <Wrapper config={props.config}>
      <div style={{ paddingLeft: 10 }}>
        <iframe
          title="content"
          className="full-frame"
          src={
            EnvironmentHelper.Common.LessonsRoot +
            "/login?jwt=" +
            jwt +
            "&returnUrl=/b1/person&churchId=" +
            churchId
          }
        />
      </div>
    </Wrapper>
  );
}
