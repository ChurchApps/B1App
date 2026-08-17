import { NextRequest, NextResponse } from "next/server";
import { buildContentSecurityPolicy, generateNonce } from "@/helpers/contentSecurityPolicy";
import { isNoindexHost } from "@/helpers/noindexHost";

const INTERNAL_HOSTS = ["localhost", "b1.church", "localtest.me"];
const INTERNAL_SUFFIXES = [".b1.church", ".localtest.me", ".localhost", ".up.railway.app", ".vercel.app"];
const CACHE_TTL = 10 * 60_000;
const cache = new Map<string, { site: string | null; exp: number }>();

export const config = { matcher: ["/((?!_next/|api/|.*\\..*).*)", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest"] };

const apiBase = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE
    || (process.env.NEXT_PUBLIC_STAGE === "prod" ? "https://api.churchapps.org" : "https://api.staging.churchapps.org");
  return base.replace(/\/$/, "") + "/membership";
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
          cache.set(host, entry);
        }
      } catch { /* lookup unreachable — fall through with no x-site */ }
    }
    if (entry.site) headers.set("x-site", entry.site);
  }
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  if (isNoindexHost(host)) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
