import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ sdSlug: string }> }) {
  const { sdSlug } = await params;
  revalidateTag(sdSlug, "default");
  return NextResponse.json({ revalidated: true });
}
