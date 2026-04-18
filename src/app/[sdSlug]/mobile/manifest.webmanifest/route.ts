import { NextResponse } from "next/server";

type Params = Promise<{ sdSlug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { sdSlug } = await params;

  let themeColor = "#0D47A1";
  let churchName = sdSlug;
  try {
    const base = process.env.NEXT_PUBLIC_MEMBERSHIP_API;
    if (base) {
      const churchRes = await fetch(`${base}/churches/lookup/?subDomain=${encodeURIComponent(sdSlug)}`, { cache: "no-store" });
      if (churchRes.ok) {
        const church = await churchRes.json();
        if (church?.name) churchName = church.name;
        if (church?.id) {
          const appearanceRes = await fetch(`${base}/settings/public/${church.id}`, { cache: "no-store" });
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

  const manifest = {
    id: "/mobile/dashboard",
    name: churchName,
    short_name: churchName,
    start_url: "/mobile/dashboard",
    scope: "/mobile",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F6F8",
    theme_color: themeColor,
    icons: [
      { src: "/mobile/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/mobile/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/mobile/icon/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/mobile/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
