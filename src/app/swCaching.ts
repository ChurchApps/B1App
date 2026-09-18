import { defaultCache } from "@serwist/next/worker";
import type { RuntimeCaching } from "serwist";
import { NetworkFirst, NetworkOnly, StaleWhileRevalidate, ExpirationPlugin, CacheableResponsePlugin } from "serwist";

const isApi = ({ url }: { url: URL }) =>
  /\/(MembershipApi|ContentApi|GivingApi|AttendanceApi|DoingApi|MessagingApi|ReportingApi)\//.test(url.href) ||
  /api\.(staging\.)?churchapps\.org/.test(url.hostname) ||
  /api\.(staging\.)?b1\.church/.test(url.hostname);

const isAuthApi = ({ url }: { url: URL }) =>
  isApi({ url }) && (/\/users\/login/.test(url.pathname) || /\/refresh/i.test(url.pathname));

const isConfigApi = ({ url }: { url: URL }) =>
  isApi({ url }) &&
  (/\/settings\/public/.test(url.pathname) ||
    /\/appearance/.test(url.pathname) ||
    /\/churches\/lookup/.test(url.pathname) ||
    /\/links\/church\//.test(url.pathname));

const isContentApi = ({ url }: { url: URL }) =>
  isApi({ url }) &&
  !isAuthApi({ url }) &&
  !isConfigApi({ url });

const isChurchImage = ({ url }: { url: URL }) =>
  /content\.(staging\.)?churchapps\.org/.test(url.hostname) ||
  /content\.lessons\.church/.test(url.hostname);

export const isMobilePath = (pathname: string) => /\/mobile(\/|$)/.test(pathname);

export const mobileRuntimeCaching: RuntimeCaching[] = [
  // Never cache auth exchanges.
  {
    matcher: isAuthApi,
    handler: new NetworkOnly()
  },
  // Config-shape API responses: network-first so admin changes propagate immediately, fall back to cache offline.
  {
    matcher: isConfigApi,
    handler: new NetworkFirst({
      cacheName: "api-config",
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 })
      ]
    })
  },
  // Content-shape API responses: network-first — stale-while-revalidate served pre-write
  // copies right after a save (upload, then list shows nothing until you navigate away).
  {
    matcher: isContentApi,
    handler: new NetworkFirst({
      cacheName: "api-content",
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 12 * 60 * 60 })
      ]
    })
  },
  // Church-hosted images: stale-while-revalidate so updated photos / images
  // propagate on the next render instead of being pinned for 30 days.
  {
    matcher: ({ url, request }) => request.destination === "image" && isChurchImage({ url }),
    handler: new StaleWhileRevalidate({
      cacheName: "church-images",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 })
      ]
    })
  },
  // Mobile app shell navigations: network-first so updates propagate, fall back to cache offline.
  {
    matcher: ({ request, url, sameOrigin }) =>
      sameOrigin && request.mode === "navigate" && isMobilePath(url.pathname),
    handler: new NetworkFirst({
      cacheName: "pages-mobile",
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 7 * 24 * 60 * 60 })
      ]
    })
  },
  // Public church pages: always from the network, never from a cache. A published CMS edit
  // has to be visible on the next load, and @serwist/next's default page caches ("others",
  // "pages-rsc", "pages") are NetworkFirst with a 24h expiry - they hand back the last cached
  // copy whenever a fetch fails, and nothing evicts an entry whose overwriting cache.put()
  // failed, so a single bad write plus one network hiccup pins the pre-edit page for the rest
  // of the TTL (issue #1095). The public site has no offline story to protect - the /mobile
  // app shell above keeps its own cache - and the static assets below are still cached, so
  // this only costs a network round trip for the markup itself.
  {
    matcher: ({ request, url, sameOrigin }) =>
      sameOrigin &&
      !url.pathname.startsWith("/api/") &&
      !isMobilePath(url.pathname) &&
      (request.mode === "navigate" ||
        request.destination === "document" ||
        request.headers.get("RSC") === "1" ||
        !!request.headers.get("Content-Type")?.includes("text/html")),
    handler: new NetworkOnly()
  },
  // Everything else Next.js recommends (static assets, RSC, fonts, etc.).
  ...defaultCache
];
