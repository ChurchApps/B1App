"use client";

import React from "react";
import dynamic from "next/dynamic";
import { PaperProps } from "@mui/material";

interface Props {
  showLogo?: boolean;
  redirectAfterLogin?: string;
  loginContainerCssProps?: PaperProps;
  keyName?: string;
}

const LoginClient: React.ComponentType<Props> = dynamic(() => import("./LoginClient").then((mod: { LoginClient: React.ComponentType<Props> }) => ({ default: mod.LoginClient })), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export function Login(props: Props) {
  return <LoginClient {...props} />;
}
