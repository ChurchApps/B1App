"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Locale } from "@churchapps/apphelper";
import { PaperProps } from "@mui/material";

interface Props {
  showLogo?: boolean;
  redirectAfterLogin?: string;
  loginContainerCssProps?: PaperProps;
  keyName?: string;
}

const LoginClient: React.ComponentType<Props> = dynamic(() => import("./LoginClient").then((mod: { LoginClient: React.ComponentType<Props> }) => ({ default: mod.LoginClient })), {
  ssr: false,
  loading: () => <div>{Locale.label("common.pleaseWait")}</div>
});

export function Login(props: Props) {
  return <LoginClient {...props} />;
}
