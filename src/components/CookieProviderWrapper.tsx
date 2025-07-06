"use client";

import { CookiesProvider } from "react-cookie";

interface Props {
  children: React.ReactNode;
}

export function CookieProviderWrapper({ children }: Props) {
  return <CookiesProvider>{children}</CookiesProvider>;
}