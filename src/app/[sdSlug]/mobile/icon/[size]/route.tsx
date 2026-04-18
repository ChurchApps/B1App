import { ImageResponse } from "next/og";

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

  let primaryColor = "#0D47A1";
  let initials = sdSlug.substring(0, 2).toUpperCase();
  let favicon: string | undefined;
  try {
    const base = process.env.NEXT_PUBLIC_MEMBERSHIP_API;
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
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={favicon}
            width={n}
            height={n}
            style={{ objectFit: "contain", width: "100%", height: "100%" }}
            alt=""
          />
        </div>
      ),
      { width: n, height: n }
    );
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
