import { ImageResponse } from "next/og";
import sharp from "sharp";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";

type Params = Promise<{ sdSlug: string; size: string }>;

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "B1";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export async function GET(_req: Request, { params }: { params: Params }) {
  const { sdSlug, size } = await params;
  const n = parseInt(size, 10);
  if (n !== 192 && n !== 512) {
    return new Response("Not found", { status: 404 });
  }

  EnvironmentHelper.init();
  const base = EnvironmentHelper.Common.MembershipApi;

  let primaryColor = "#0D47A1";
  let initials = sdSlug.substring(0, 2).toUpperCase();
  let favicon: string | undefined;
  try {
    if (base) {
      const churchRes = await fetch(`${base}/churches/lookup/?subDomain=${encodeURIComponent(sdSlug)}`, { cache: "no-store" });
      if (churchRes.ok) {
        const church = await churchRes.json();
        if (church?.name) initials = getInitials(church.name);
        if (church?.id) {
          const appearanceRes = await fetch(`${base}/settings/public/${church.id}`, { cache: "no-store" });
          if (appearanceRes.ok) {
            const appearance = await appearanceRes.json();
            primaryColor = appearance?.primaryColor || primaryColor;
            favicon = appearance?.favicon_400x400 || appearance?.favicon_16x16;
          }
        }
      }
    }
  } catch {
    /* use default */
  }

  if (favicon) {
    try {
      const imgRes = await fetch(favicon, { cache: "no-store" });
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const resized = await sharp(buf)
          .resize(n, n, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        return new Response(new Uint8Array(resized), {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    } catch {
      /* fall through to generated initials icon */
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: primaryColor,
          color: "white",
          fontSize: Math.floor(n * 0.38),
          fontWeight: 700,
          letterSpacing: "-0.03em",
          fontFamily: "sans-serif",
        }}
      >
        {initials}
      </div>
    ),
    { width: n, height: n }
  );
}
