import { NextRequest } from "next/server";
import { ApiHelper } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers";
import { loadPublicSiteHidden } from "@/helpers/publicSiteServer";

interface SitemapPage { url?: string; title?: string; }
interface SitemapPost { slug?: string; }
interface SitemapSermon { id?: string; publishDate?: string; }
interface SitemapRedirect { fromPath?: string; }

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const getBaseUrl = (request: NextRequest, sdSlug: string) => {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || sdSlug + ".b1.church";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return proto + "://" + host;
};

export async function GET(request: NextRequest, context: { params: Promise<{ sdSlug: string }> }) {
  const { sdSlug } = await context.params;
  EnvironmentHelper.init();
  const base = getBaseUrl(request, sdSlug);
  if (await loadPublicSiteHidden(sdSlug)) {
    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n</urlset>", { headers: { "Content-Type": "application/xml", "X-Robots-Tag": "noindex, nofollow" } });
  }
  // path -> lastmod (YYYY-MM-DD) when we know when it last changed
  const urls = new Map<string, string | undefined>([["/", undefined]]);
  const getJson = async (url: string) => {
    const response = await fetch(url, { next: { revalidate: 3600, tags: [sdSlug] } } as RequestInit);
    return response.ok ? response.json() : null;
  };
  const toDate = (value?: string) => {
    const date = value ? new Date(value) : null;
    return date && !isNaN(date.getTime()) ? date.toISOString().substring(0, 10) : undefined;
  };

  try {
    const membershipApi = ApiHelper.getConfig("MembershipApi")?.url;
    const contentApi = ApiHelper.getConfig("ContentApi")?.url;
    const doingApi = ApiHelper.getConfig("DoingApi")?.url;
    const churchResponse = await fetch(membershipApi + "/churches/lookup/?subDomain=" + sdSlug, { next: { revalidate: 3600, tags: [sdSlug] } } as RequestInit);
    const church = churchResponse.ok ? await churchResponse.json() : null;
    if (church?.id) {
      const siteId = church?.siteId || "";
      // Endpoint added alongside this route; older API deploys 404 and we fall back to the home page.
      const pagesResponse = await fetch(contentApi + "/pages/public/" + church.id + (siteId ? "?siteId=" + siteId : ""), { next: { revalidate: 3600, tags: [sdSlug] } } as RequestInit);
      if (pagesResponse.ok) {
        const pages: SitemapPage[] = await pagesResponse.json();
        pages.forEach((p) => { if (p.url?.startsWith("/")) urls.set(p.url, undefined); });
      }
      if (!siteId) {
        const postsResponse = await fetch(contentApi + "/posts/public/" + church.id + "?pageSize=50", { next: { revalidate: 3600, tags: [sdSlug] } } as RequestInit);
        if (postsResponse.ok) {
          const posts: SitemapPost[] = await postsResponse.json();
          if (Array.isArray(posts) && posts.length > 0) {
            urls.set("/blog", undefined);
            posts.forEach((p) => { if (p.slug) urls.set("/blog/" + p.slug, undefined); });
          }
        }
      }
      // A saved redirect replaces a built-in page (see [pageSlug]/page.tsx), so the old path stays out.
      const redirects: SitemapRedirect[] | null = await getJson(contentApi + "/redirects/public/" + church.id).catch(() => null);
      const redirected = new Set((Array.isArray(redirects) ? redirects : []).map((r) => (r.fromPath || "").toLowerCase()));
      const addBuiltIn = (path: string, lastmod?: string) => { if (!urls.has(path) && !redirected.has(path)) urls.set(path, lastmod); };

      const sermons: SitemapSermon[] | null = await getJson(contentApi + "/sermons/public/" + church.id);
      if (Array.isArray(sermons)) {
        const recent = sermons
          .filter((s) => s.id)
          .sort((a, b) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime())
          .slice(0, 50);
        if (recent.length > 0) addBuiltIn("/sermons", toDate(recent[0].publishDate));
        recent.forEach((s) => urls.set("/sermons/" + s.id, toDate(s.publishDate)));
      }

      // The built-in groups and volunteer pages are only worth listing when they have something on them.
      const groups = await getJson(membershipApi + "/groups/public/" + church.id + "/list").catch(() => null);
      if (Array.isArray(groups) && groups.length > 0) addBuiltIn("/groups");
      const signupPlans = await getJson(doingApi + "/plans/public/signup/" + church.id).catch(() => null);
      if (Array.isArray(signupPlans) && signupPlans.length > 0) addBuiltIn("/volunteer");
    }
  } catch { /* fall back to home page only */ }

  const body = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
    + "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
    + Array.from(urls).map(([u, lastmod]) => "  <url><loc>" + escapeXml(base + u) + "</loc>" + (lastmod ? "<lastmod>" + lastmod + "</lastmod>" : "") + "</url>").join("\n")
    + "\n</urlset>";
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
