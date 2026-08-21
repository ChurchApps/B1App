export const dynamic = "force-dynamic";
export async function GET() {
  const g = globalThis as any;
  return Response.json({ node: process.version, errors: g.__debug1001 || [] });
}
