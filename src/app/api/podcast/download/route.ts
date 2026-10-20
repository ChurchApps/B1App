import { NextRequest, NextResponse } from "next/server";
import { PodcastDownloadError, preparePodcastDownload } from "@/helpers/podcastDownload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const result = await preparePodcastDownload(req.nextUrl.searchParams.get("url") || "", req.nextUrl.searchParams.get("guid") || "");
    return new Response(result.body, { status: 200, headers: result.headers });
  } catch (e) {
    if (e instanceof PodcastDownloadError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Unable to download this episode" }, { status: 502 });
  }
}
