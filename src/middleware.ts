import { NextRequest, NextResponse } from "next/server";
import { buildContentSecurityPolicy, generateNonce, insecureApiOrigins } from "@/helpers/contentSecurityPolicy";
import { canonicalLink, ownsSubdomain } from "@/helpers/canonicalLink";
import { embedFrameAncestors, isEmbedPath } from "@/helpers/embed";
import { isNoindexHost } from "@/helpers/noindexHost";
import { isAllowedWhenPublicSiteHidden, isPublicSiteHidden } from "@/helpers/publicSite";

const INTERNAL_HOSTS = ["localhost", "b1.church", "localtest.me"];
const INTERNAL_SUFFIXES = [".b1.church", ".localtest.me", ".localhost", ".up.railway.app", ".vercel.app"];
const CACHE_TTL = 10 * 60_000;
const CACHE_MAX = 5000;
// Subdomains are [a-z0-9] only, so this never resolves to a church (vs. the host rewrite guessing one).
const UNKNOWN_SITE = "_unknown.invalid";
const cache = new Map<string, { site: string | null; exp: number }>();
// The church's public content settings this file acts on, per subdomain: hidePublicSite, and embedDomains as CSP sources.
// Kept short because the admin's revalidate call can't clear this per-instance map; dev/test read it fresh.
interface SiteSettings { hidden: boolean; frameAncestors: string[] }
const NO_SETTINGS: SiteSettings = { hidden: false, frameAncestors: [] };
const SETTINGS_TTL = process.env.NODE_ENV === "production" ? 60_000 : 0;
const settingsCache = new Map<string, { settings: SiteSettings; exp: number }>();

export const config = { matcher: ["/((?!_next/|api/|.*\\..*).*)", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest"] };

const SELF_HOSTED = process.env.NEXT_PUBLIC_STAGE === "selfhost";
const apiRoot = () => {
  const base = (SELF_HOSTED && process.env.B1_API_INTERNAL_URL) || process.env.NEXT_PUBLIC_API_BASE
    || (process.env.NEXT_PUBLIC_STAGE === "prod" ? "https://api.churchapps.org" : "https://api.staging.churchapps.org");
  return base.replace(/\/$/, "");
};
const apiBase = () => apiRoot() + "/membership";

// The church subdomain the request renders as, mirroring the host rewrites in next.config.
const getSubDomain = (host: string, isInternal: boolean, site: string | null) => {
  if (!isInternal) return site ? site.split(".")[0] : null;
  if (host.endsWith(".up.railway.app")) return process.env.DEFAULT_CHURCH_SLUG || "church";
  if (host.endsWith(".vercel.app") || !host.includes(".")) return null;
  return INTERNAL_HOSTS.includes(host) ? null : host.split(".")[0];
};

const cacheSettings = (subDomain: string, settings: SiteSettings) => {
  if (SETTINGS_TTL <= 0) return settings;
  if (settingsCache.size >= CACHE_MAX) settingsCache.clear();
  settingsCache.set(subDomain, { settings, exp: Date.now() + SETTINGS_TTL });
  return settings;
};

// One lookup serves the hidden-site gate and the embed frame policy. Only confirmed answers are cached; 5xx blips
// and errors serve the site rather than lock everyone out, and leave embed routes on the default frame policy.
const loadSiteSettings = async (subDomain: string): Promise<SiteSettings> => {
  const cached = settingsCache.get(subDomain);
  if (cached && cached.exp >= Date.now()) return cached.settings;
  try {
    const churchRes = await fetch(apiBase() + "/churches/lookup/?subDomain=" + encodeURIComponent(subDomain), { signal: AbortSignal.timeout(3000) });
    if (churchRes.status === 404) return cacheSettings(subDomain, NO_SETTINGS);
    if (!churchRes.ok) return NO_SETTINGS;
    const church = await churchRes.json().catch((): null => null);
    if (!church?.id) return cacheSettings(subDomain, NO_SETTINGS);
    const settingsRes = await fetch(apiRoot() + "/content/settings/public/" + encodeURIComponent(church.id), { signal: AbortSignal.timeout(3000) });
    if (!settingsRes.ok) return NO_SETTINGS;
    const settings = await settingsRes.json().catch((): null => null);
    return cacheSettings(subDomain, { hidden: isPublicSiteHidden(settings), frameAncestors: embedFrameAncestors(settings?.embedDomains) });
  } catch { return NO_SETTINGS; }
};

// Signed-in members (unexpired jwt cookie set by LoginPage) see the site; this is a soft gate, so the payload is not verified.
const hasSession = (req: NextRequest) => {
  const payload = req.cookies.get("jwt")?.value?.split(".")[1];
  if (!payload) return false;
  try {
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch { return false; }
};

// Resolves a custom domain to its {sub}.b1.church site. Only confirmed answers are cached; 5xx blips and errors are not.
const lookupSite = async (host: string) => {
  let entry = cache.get(host);
  if (!entry || entry.exp < Date.now()) {
    entry = { site: null, exp: 0 };
    try {
      const res = await fetch(apiBase() + "/domains/public/lookup/" + encodeURIComponent(host), { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json().catch((): null => null);
        if (data?.subDomain) entry.site = data.subDomain + ".b1.church";
        entry.exp = Date.now() + CACHE_TTL;
        if (cache.size >= CACHE_MAX) cache.clear();
        cache.set(host, entry);
      }
    } catch { /* lookup unreachable — treated as no site */ }
  }
  return entry.site;
};

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].split(":")[0].trim().toLowerCase();
  const isInternal = !host || INTERNAL_HOSTS.includes(host) || INTERNAL_SUFFIXES.some((s) => host.endsWith(s));

  const headers = new Headers(req.headers);
  headers.delete("x-site"); // never trust a client-supplied x-site (spoofable rewrite input)
  headers.delete("x-public-host");

  // Caddy sends the visitor's domain in X-Church-Host because Vercel overwrites x-forwarded-host; trusted only if it maps to this subdomain.
  let publicHost: string | null = null;
  const claimed = (req.headers.get("x-church-host") || "").split(":")[0].trim().toLowerCase();
  if (claimed && host.endsWith(".b1.church") && !INTERNAL_SUFFIXES.some((s) => claimed.endsWith(s)) && ownsSubdomain(host, await lookupSite(claimed))) {
    publicHost = claimed;
    headers.set("x-public-host", claimed);
  }

  let site: string | null = null;
  if (!isInternal) {
    site = await lookupSite(host);
    headers.set("x-site", site || UNKNOWN_SITE);
  }
  // Self-hosted: whatever the host, an unmatched request renders the instance's default church.
  if (SELF_HOSTED && !site) headers.set("x-site", (process.env.DEFAULT_CHURCH_SLUG || "church") + ".b1.church");

  const pathname = req.nextUrl.pathname;
  const embed = isEmbedPath(pathname);
  const gated = !isAllowedWhenPublicSiteHidden(pathname) && !hasSession(req);
  // Only an embed route may be framed by the church's own website; every other path keeps the default frame-ancestors.
  let frameAncestors: string[] = [];
  if (embed || gated) {
    const subDomain = getSubDomain(host, isInternal, site);
    const settings = subDomain ? await loadSiteSettings(subDomain) : NO_SETTINGS;
    if (gated && settings.hidden) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("returnUrl", pathname + req.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    if (embed) frameAncestors = settings.frameAncestors;
  }

  // Next reads the nonce off the request-side CSP header and stamps it onto the
  // scripts it renders, which is what lets script-src drop 'unsafe-inline'.
  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    dev: process.env.NODE_ENV !== "production",
    apiOrigins: insecureApiOrigins([process.env.NEXT_PUBLIC_API_BASE, process.env.NEXT_PUBLIC_LESSONS_API, process.env.NEXT_PUBLIC_MESSAGING_API_SOCKET]),
    frameAncestors
  });
  headers.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  if (isNoindexHost(host) || embed) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  else {
    const proto = (req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
    const link = canonicalLink(publicHost || req.headers.get("x-forwarded-host") || req.headers.get("host"), proto, pathname);
    if (link) res.headers.append("Link", link);
  }
  return res;
}
