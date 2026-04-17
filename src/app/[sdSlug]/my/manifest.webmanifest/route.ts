import { NextResponse } from "next/server";

type Params = Promise<{ sdSlug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { sdSlug } = await params;
  if (sdSlug !== "ironwood") {
    return new NextResponse("Not found", { status: 404 });
  }

  let themeColor = "#1976d2";
  try {
    const base = process.env.NEXT_PUBLIC_MEMBERSHIP_API;
    if (base) {
      const churchRes = await fetch(`${base}/churches/lookup/?subDomain=ironwood`, { cache: "no-store" });
      if (churchRes.ok) {
        const church = await churchRes.json();
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
    id: "/my/timeline",
    name: "Ironwood",
    short_name: "Ironwood",
    start_url: "/my/timeline",
    scope: "/my",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: themeColor,
    icons: [
      { src: "/my/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/my/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
