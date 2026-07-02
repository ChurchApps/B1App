import React from "react";
import { headers } from "next/headers";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { Theme } from "@/components";
import { BrandedNotFound } from "@/components/seo/BrandedNotFound";

const deriveSubdomain = (host: string | null, xSite: string | null): string | null => {
  const source = xSite || host;
  if (!source) return null;
  const hostname = source.split(":")[0].toLowerCase();
  const labels = hostname.split(".");
  const first = labels[0];
  const blocked = ["www", "localhost", "b1", "churchapps", "staging", "app"];
  // A church subdomain is the first label of e.g. grace.b1.church / grace.localtest.me.
  if (labels.length < 2 || blocked.includes(first) || hostname.endsWith(".up.railway.app")) return null;
  return first;
};

export default async function NotFound() {
  await EnvironmentHelper.initServerSide();
  EnvironmentHelper.init();

  const headerList = await headers();
  const subdomain = deriveSubdomain(headerList.get("host"), headerList.get("x-site"));

  if (subdomain) {
    try {
      const config = await ConfigHelper.load(subdomain, "website");
      const logo = config.appearance?.logoLight || config.appearance?.logoDark;
      return (
        <>
          <Theme config={config} />
          <BrandedNotFound churchName={config.church?.name} logo={logo} homeUrl="/" />
        </>
      );
    } catch {
      // Church lookup failed; fall through to the generic 404.
    }
  }

  return <BrandedNotFound />;
}
