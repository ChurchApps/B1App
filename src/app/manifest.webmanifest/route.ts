import { NextResponse } from "next/server";
import { buildManifest } from "../manifestHelper";

const resolveChurchSlug = (req: Request): string => {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("church")?.trim();
  if (fromQuery) return fromQuery;

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const isNgrok = /\.ngrok-free\.(app|dev)$/i.test(host);
  if (isNgrok) {
    return process.env.NGROK_CHURCH_SLUG
      || process.env.DEFAULT_CHURCH_SLUG
      || "localhost";
  }

  return process.env.DEFAULT_CHURCH_SLUG || "localhost";
};

export async function GET(req: Request) {
  const sdSlug = resolveChurchSlug(req);
  const manifest = await buildManifest(sdSlug, `/${sdSlug}`);

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
