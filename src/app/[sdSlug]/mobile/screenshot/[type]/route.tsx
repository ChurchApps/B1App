import { ImageResponse } from "next/og";

type Params = Promise<{ sdSlug: string; type: string }>;

const SIZES: Record<string, { width: number; height: number }> = {
  wide: { width: 1280, height: 720 },
  narrow: { width: 720, height: 1280 },
};

export async function GET(_req: Request, { params }: { params: Params }) {
  const { sdSlug, type } = await params;
  const dims = SIZES[type];
  if (!dims) return new Response("Not found", { status: 404 });

  let primaryColor = "#0D47A1";
  let churchName = sdSlug;
  let favicon: string | undefined;
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
            primaryColor = appearance?.primaryColor || primaryColor;
            favicon = appearance?.favicon_400x400 || appearance?.favicon_16x16;
          }
        }
      }
    }
  } catch {
    /* use defaults */
  }

  const iconSize = type === "wide" ? 200 : 240;
  const titleSize = type === "wide" ? 72 : 56;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${primaryColor} 0%, #000000 160%)`,
          color: "white",
          fontFamily: "sans-serif",
          padding: 40,
        }}
      >
        {favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={favicon}
            width={iconSize}
            height={iconSize}
            style={{ borderRadius: iconSize / 5, marginBottom: 32, objectFit: "contain", background: "white" }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 5,
              background: "rgba(255,255,255,0.15)",
              marginBottom: 32,
            }}
          />
        )}
        <div style={{ fontSize: titleSize, fontWeight: 700, letterSpacing: "-0.02em", textAlign: "center" }}>
          {churchName}
        </div>
        <div style={{ fontSize: titleSize / 3, opacity: 0.8, marginTop: 16 }}>Mobile App</div>
      </div>
    ),
    dims
  );
}
