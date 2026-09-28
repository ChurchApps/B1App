type Params = Promise<{ sdSlug: string; day: string; shape: string }>;

const SHAPES = ["9x16", "16x9", "1x1"];

// Same-origin copy of the day's votd.org picture. votd.org sends no CORS header, so the
// mobile Verse of the Day screen can't fetch it as a file to share without this.
export async function GET(_req: Request, { params }: { params: Params }) {
  const { day, shape } = await params;
  const n = parseInt(day, 10);
  if (!/^\d+$/.test(day) || n < 1 || n > 366 || !SHAPES.includes(shape)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const imgRes = await fetch(`https://votd.org/v1/${n}/${shape}.jpg`, { next: { revalidate: 86400 } });
    if (!imgRes.ok) return new Response("Bad gateway", { status: 502 });
    const buf = await imgRes.arrayBuffer();
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400"
      }
    });
  } catch {
    return new Response("Bad gateway", { status: 502 });
  }
}
