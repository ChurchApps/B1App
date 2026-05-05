import { NextResponse } from "next/server";
import { loadChurchAppearance } from "../mobile/loadChurchAppearance";

type Params = Promise<{ sdSlug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { sdSlug } = await params;

  const { churchName, primaryColor } = await loadChurchAppearance(sdSlug);
  const themeColor = primaryColor || "#0D47A1";
  const safeName = (churchName && churchName.trim()) || sdSlug || "Church";
  const shortName = safeName.length > 12 ? safeName.substring(0, 12) : safeName;

  const manifest = {
    id: "dashboard",
    name: safeName,
    short_name: shortName,
    description: `${safeName} mobile app`,
    start_url: "mobile/dashboard?source=pwa",
    scope: "./",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F6F8",
    theme_color: themeColor,
    categories: ["lifestyle", "social"],
    icons: [
      { src: "mobile/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "mobile/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "mobile/icon/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "mobile/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    screenshots: [
      {
        src: "mobile/screenshot/wide",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: `${safeName} dashboard`
      },
      {
        src: "mobile/screenshot/narrow",
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
        label: `${safeName} dashboard`
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
