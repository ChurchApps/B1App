"use client";
import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { appDisplayMode, mobileAnalyticsIds, mobileAnalyticsInitScript } from "@/helpers/mobileAnalytics";

// Page views go to ChurchApps' tag and, when set, the church's own GA4 id,
// tagged with whether the app was opened installed or in a browser.
export default function MobileGoogleAnalytics({ churchGaId }: { churchGaId?: string }) {
  const pathname = usePathname();
  const ids = mobileAnalyticsIds(EnvironmentHelper.Common.GoogleAnalyticsTag, churchGaId);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (!idsKey || !pathname) return;
    const url = pathname + (typeof window !== "undefined" ? window.location.search : "");
    if (typeof window.gtag !== "undefined") {
      const displayMode = appDisplayMode(window);
      idsKey.split(",").forEach((id) => window.gtag("config", id, { page_path: url, display_mode: displayMode }));
    }
  }, [pathname, idsKey]);

  if (ids.length === 0) return null;

  return (
    <>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${ids[0]}`} />
      <Script
        id="mobile-google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: mobileAnalyticsInitScript(ids) }}
      />
    </>
  );
}
