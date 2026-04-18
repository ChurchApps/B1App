import React from "react";
import { Theme } from "@/components";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MobileShell } from "./MobileShell";

interface Props {
  sdSlug: string;
  config: ConfigurationInterface;
  children: React.ReactNode;
}

export function MobilePageWrapper({ sdSlug, config, children }: Props) {
  return (
    <>
      <Theme config={config} />
      <AuthGuard sdSlug={sdSlug}>
        <MobileShell config={config}>{children}</MobileShell>
      </AuthGuard>
    </>
  );
}
