import { NextRequest } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ sdSlug: string }> }) {
  const { sdSlug } = await context.params;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || sdSlug + ".b1.church";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /mobile/",
    "Disallow: /login",
    "Disallow: /logout",
    "",
    "Sitemap: " + proto + "://" + host + "/sitemap.xml"
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
