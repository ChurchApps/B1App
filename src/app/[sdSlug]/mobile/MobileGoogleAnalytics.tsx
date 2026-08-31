"use client";
import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";

export default function MobileGoogleAnalytics() {
  const pathname = usePathname();
  const gaId = EnvironmentHelper.Common.GoogleAnalyticsTag;

  useEffect(() => {
    if (!gaId || !pathname) return;
    const url = pathname + (typeof window !== "undefined" ? window.location.search : "");
    if (typeof window.gtag !== "undefined") {
      window.gtag("config", gaId, { page_path: url });
    }
  }, [pathname, gaId]);

  if (!gaId) return null;

  return (
    <>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      <Script
        id="mobile-google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');` }}
      />
    </>
  );
}
