export const dynamic = "force-dynamic";
const g = globalThis as any;
g.__debug1001 = g.__debug1001 || [];
export async function GET() {
  return Response.json({ node: process.version, count: g.__debug1001.length, items: g.__debug1001 });
}
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({ bad: true }));
  g.__debug1001.unshift({ at: new Date().toISOString(), ...body });
  g.__debug1001 = g.__debug1001.slice(0, 50);
  return Response.json({ ok: true, count: g.__debug1001.length });
}
