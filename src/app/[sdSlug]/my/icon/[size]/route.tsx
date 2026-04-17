import { ImageResponse } from "next/og";

type Params = Promise<{ sdSlug: string; size: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { sdSlug, size } = await params;
  if (sdSlug !== "ironwood") {
    return new Response("Not found", { status: 404 });
  }
  const n = parseInt(size, 10);
  if (n !== 192 && n !== 512) {
    return new Response("Not found", { status: 404 });
  }

  let primaryColor = "#1976d2";
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
            primaryColor = appearance?.primaryColor || primaryColor;
          }
        }
      }
    }
  } catch {
    /* use default */
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
        IW
      </div>
    ),
    { width: n, height: n }
  );
}
