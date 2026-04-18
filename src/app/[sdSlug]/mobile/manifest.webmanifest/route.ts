import { NextResponse } from "next/server";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";

type Params = Promise<{ sdSlug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { sdSlug } = await params;

  EnvironmentHelper.init();
  const apiBase = EnvironmentHelper.Common.MembershipApi;

  let themeColor = "#0D47A1";
  let churchName = sdSlug;
  try {
    if (apiBase) {
      const churchRes = await fetch(`${apiBase}/churches/lookup/?subDomain=${encodeURIComponent(sdSlug)}`, { cache: "no-store" });
      if (churchRes.ok) {
        const church = await churchRes.json();
        if (church?.name) churchName = church.name;
        if (church?.id) {
          const appearanceRes = await fetch(`${apiBase}/settings/public/${church.id}`, { cache: "no-store" });
          if (appearanceRes.ok) {
            const appearance = await appearanceRes.json();
            themeColor = appearance?.primaryColor || themeColor;
          }
        }
      }
    }
  } catch {
    /* fall back to defaults */
  }

  const safeName = (churchName && churchName.trim()) || sdSlug || "Church";
  const shortName = safeName.length > 12 ? safeName.substring(0, 12) : safeName;

  // Use paths relative to the manifest URL. The browser resolves them against the
  // origin that actually served the manifest (custom domain or b1.church subdomain),
  // which keeps start_url / scope / icons / screenshots same-origin and valid.
  // Manifest URL: <origin>/mobile/manifest.webmanifest, so "dashboard" → /mobile/dashboard
  const manifest = {
    id: "dashboard",
    name: safeName,
    short_name: shortName,
    description: `${safeName} mobile app`,
    start_url: "dashboard?source=pwa",
    scope: "./",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F6F8",
    theme_color: themeColor,
    categories: ["lifestyle", "social"],
    icons: [
      { src: "icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "icon/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: "screenshot/wide",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: `${safeName} dashboard`,
      },
      {
        src: "screenshot/narrow",
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
        label: `${safeName} dashboard`,
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
