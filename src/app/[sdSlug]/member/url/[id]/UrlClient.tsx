"use client";

import React from "react";
import { WrapperPageProps } from "@/helpers";
import UserContext from "@/context/UserContext";
import { Wrapper } from "@/components";

interface Props extends WrapperPageProps {
  urlId: string;
}

export function UrlClient({ config, urlId }: Props) {
  const context = React.useContext(UserContext);
  const jwt = context.userChurch?.jwt;
  const churchId = context.userChurch?.church.id;

  const url
    = urlId === "chums"
      ? `https://app.chums.org/login?jwt=${jwt}&churchId=${churchId}`
      : config.navLinks.find((t) => t.id === urlId)?.url;

  return (
    <Wrapper config={config}>
      <iframe title="content" className="full-frame" src={url} />
    </Wrapper>
  );
}
