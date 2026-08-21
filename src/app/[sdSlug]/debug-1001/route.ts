export const dynamic = "force-dynamic";
export async function GET() {
  const g = globalThis as any;
  return Response.json({ node: process.version, stage: process.env.NEXT_PUBLIC_STAGE, hits: g.__debug1001Hits || 0, errors: g.__debug1001 || [] });
}
