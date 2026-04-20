import { ImageResponse } from "next/og";
import sharp from "sharp";
import { loadChurchAppearance } from "../../loadChurchAppearance";

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

  const { churchName, primaryColor, favicon } = await loadChurchAppearance(sdSlug);
  const fallbackInitials = sdSlug.substring(0, 2).toUpperCase();
  const initials = churchName ? getInitials(churchName) : fallbackInitials;
  const bgColor = primaryColor || "#0D47A1";

  if (favicon) {
    try {
      const imgRes = await fetch(favicon, { next: { revalidate: 3600 } });
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
            "Cache-Control": "public, max-age=3600"
          }
        });
      }
    } catch {

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
          background: bgColor,
          color: "white",
          fontSize: Math.floor(n * 0.38),
          fontWeight: 700,
          letterSpacing: "-0.03em",
          fontFamily: "sans-serif"
        }}
      >
        {initials}
      </div>
    ),
    { width: n, height: n }
  );
}
