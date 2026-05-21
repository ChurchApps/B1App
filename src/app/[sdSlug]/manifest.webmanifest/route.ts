import { NextResponse } from "next/server";
import { buildManifest } from "../../manifestHelper";

type Params = Promise<{ sdSlug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { sdSlug } = await params;
  const manifest = await buildManifest(sdSlug, `/${sdSlug}`);

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
