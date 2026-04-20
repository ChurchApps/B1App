import React from "react";
import { Theme } from "@/components";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MobileShell } from "./MobileShell";

interface Props {
  sdSlug: string;
  config: ConfigurationInterface;
  children: React.ReactNode;
}

export function MobilePageWrapper({ sdSlug: _sdSlug, config, children }: Props) {

  return (
    <>
      <Theme config={config} />
      <MobileShell config={config}>{children}</MobileShell>
    </>
  );
}
