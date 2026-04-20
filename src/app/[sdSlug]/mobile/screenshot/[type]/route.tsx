import { ImageResponse } from "next/og";
import { loadChurchAppearance } from "../../loadChurchAppearance";

type Params = Promise<{ sdSlug: string; type: string }>;

const SIZES: Record<string, { width: number; height: number }> = {
  wide: { width: 1280, height: 720 },
  narrow: { width: 720, height: 1280 }
};

export async function GET(_req: Request, { params }: { params: Params }) {
  const { sdSlug, type } = await params;
  const dims = SIZES[type];
  if (!dims) return new Response("Not found", { status: 404 });

  const { churchName, primaryColor, favicon } = await loadChurchAppearance(sdSlug);
  const displayName = churchName || sdSlug;
  const bgColor = primaryColor || "#0D47A1";

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
          background: `linear-gradient(135deg, ${bgColor} 0%, #000000 160%)`,
          color: "white",
          fontFamily: "sans-serif",
          padding: 40
        }}
      >
        {favicon ? (

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
              marginBottom: 32
            }}
          />
        )}
        <div style={{ fontSize: titleSize, fontWeight: 700, letterSpacing: "-0.02em", textAlign: "center" }}>
          {displayName}
        </div>
        <div style={{ fontSize: titleSize / 3, opacity: 0.8, marginTop: 16 }}>Mobile App</div>
      </div>
    ),
    dims
  );
}
