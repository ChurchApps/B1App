import { NextRequest, NextResponse } from "next/server";
import { buildContentSecurityPolicy, generateNonce } from "@/helpers/contentSecurityPolicy";
import { canonicalLink } from "@/helpers/canonicalLink";
import { isNoindexHost } from "@/helpers/noindexHost";
import { isAllowedWhenPublicSiteHidden, isPublicSiteHidden } from "@/helpers/publicSite";

const INTERNAL_HOSTS = ["localhost", "b1.church", "localtest.me"];
const INTERNAL_SUFFIXES = [".b1.church", ".localtest.me", ".localhost", ".up.railway.app", ".vercel.app"];
const CACHE_TTL = 10 * 60_000;
const CACHE_MAX = 5000;
// Subdomains are [a-z0-9] only, so this never resolves to a church (vs. the host rewrite guessing one).
const UNKNOWN_SITE = "_unknown.invalid";
const cache = new Map<string, { site: string | null; exp: number }>();
// hidePublicSite per subdomain. Kept short because the admin's revalidate call can't clear this per-instance map; dev/test read it fresh.
const HIDDEN_TTL = process.env.NODE_ENV === "production" ? 60_000 : 0;
const hiddenCache = new Map<string, { hidden: boolean; exp: number }>();

export const config = { matcher: ["/((?!_next/|api/|.*\\..*).*)", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest"] };

const apiRoot = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE
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

const cacheHidden = (subDomain: string, hidden: boolean) => {
  if (HIDDEN_TTL <= 0) return hidden;
  if (hiddenCache.size >= CACHE_MAX) hiddenCache.clear();
  hiddenCache.set(subDomain, { hidden, exp: Date.now() + HIDDEN_TTL });
  return hidden;
};

// Only confirmed answers are cached; 5xx blips and errors serve the site rather than lock everyone out.
const isHiddenSite = async (subDomain: string) => {
  const cached = hiddenCache.get(subDomain);
  if (cached && cached.exp >= Date.now()) return cached.hidden;
  try {
    const churchRes = await fetch(apiBase() + "/churches/lookup/?subDomain=" + encodeURIComponent(subDomain), { signal: AbortSignal.timeout(3000) });
    if (churchRes.status === 404) return cacheHidden(subDomain, false);
    if (!churchRes.ok) return false;
    const church = await churchRes.json().catch((): null => null);
    if (!church?.id) return cacheHidden(subDomain, false);
    const settingsRes = await fetch(apiRoot() + "/content/settings/public/" + encodeURIComponent(church.id), { signal: AbortSignal.timeout(3000) });
    if (!settingsRes.ok) return false;
    return cacheHidden(subDomain, isPublicSiteHidden(await settingsRes.json().catch((): null => null)));
  } catch { return false; }
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

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].split(":")[0].trim().toLowerCase();
  const isInternal = !host || INTERNAL_HOSTS.includes(host) || INTERNAL_SUFFIXES.some((s) => host.endsWith(s));

  const headers = new Headers(req.headers);
  headers.delete("x-site"); // never trust a client-supplied x-site (spoofable rewrite input)

  // Next reads the nonce off the request-side CSP header and stamps it onto the
  // scripts it renders, which is what lets script-src drop 'unsafe-inline'.
  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy({ nonce, dev: process.env.NODE_ENV !== "production" });
  headers.set("Content-Security-Policy", csp);

  let site: string | null = null;
  if (!isInternal) {
    let entry = cache.get(host);
    if (!entry || entry.exp < Date.now()) {
      entry = { site: null, exp: 0 };
      try {
        const res = await fetch(apiBase() + "/domains/public/lookup/" + encodeURIComponent(host), { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json().catch((): null => null);
          if (data?.subDomain) entry.site = data.subDomain + ".b1.church";
          entry.exp = Date.now() + CACHE_TTL; // cache hits and confirmed misses; 5xx blips and errors are never cached
          if (cache.size >= CACHE_MAX) cache.clear();
          cache.set(host, entry);
        }
      } catch { /* lookup unreachable — fall through with no x-site */ }
    }
    headers.set("x-site", entry.site || UNKNOWN_SITE);
    site = entry.site;
  }

  const pathname = req.nextUrl.pathname;
  if (!isAllowedWhenPublicSiteHidden(pathname) && !hasSession(req)) {
    const subDomain = getSubDomain(host, isInternal, site);
    if (subDomain && await isHiddenSite(subDomain)) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("returnUrl", pathname + req.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  if (isNoindexHost(host)) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  else {
    const proto = (req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
    const link = canonicalLink(req.headers.get("x-forwarded-host") || req.headers.get("host"), proto, pathname);
    if (link) res.headers.append("Link", link);
  }
  return res;
}
