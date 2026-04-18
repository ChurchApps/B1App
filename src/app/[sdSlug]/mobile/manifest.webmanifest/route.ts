import { NextResponse } from "next/server";

type Params = Promise<{ sdSlug: string }>;

export async function GET(req: Request, { params }: { params: Params }) {
  const { sdSlug } = await params;

  const url = new URL(req.url);
  const origin = url.origin;
  // The manifest is served at either /mobile/manifest.webmanifest (custom domain, rewritten internally)
  // or /<sdSlug>/mobile/manifest.webmanifest (direct). Derive the base accordingly so paths resolve in both.
  const basePath = url.pathname.endsWith(`/${sdSlug}/mobile/manifest.webmanifest`)
    ? `/${sdSlug}/mobile`
    : "/mobile";

  let themeColor = "#0D47A1";
  let churchName = sdSlug;
  try {
    const apiBase = process.env.NEXT_PUBLIC_MEMBERSHIP_API;
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
  const startUrl = `${origin}${basePath}/dashboard`;

  const manifest = {
    id: startUrl,
    name: safeName,
    short_name: shortName,
    description: `${safeName} mobile app`,
    start_url: startUrl,
    scope: `${origin}${basePath}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F6F8",
    theme_color: themeColor,
    categories: ["lifestyle", "social"],
    icons: [
      { src: `${basePath}/icon/192`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${basePath}/icon/512`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${basePath}/icon/192`, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: `${basePath}/icon/512`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: `${basePath}/screenshot/wide`,
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: `${safeName} dashboard`,
      },
      {
        src: `${basePath}/screenshot/narrow`,
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
        label: `${safeName} dashboard`,
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
