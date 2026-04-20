/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import {
  Serwist,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
  CacheFirst,
  ExpirationPlugin,
  CacheableResponsePlugin
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

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

const mobileRuntimeCaching: RuntimeCaching[] = [
  // Never cache auth exchanges.
  {
    matcher: isAuthApi,
    handler: new NetworkOnly()
  },
  // Config-shape API responses: stale-while-revalidate, 1 day.
  {
    matcher: isConfigApi,
    handler: new StaleWhileRevalidate({
      cacheName: "api-config",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 })
      ]
    })
  },
  // Content-shape API responses: stale-while-revalidate, 12h.
  {
    matcher: isContentApi,
    handler: new StaleWhileRevalidate({
      cacheName: "api-content",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 12 * 60 * 60 })
      ]
    })
  },
  // Church-hosted images: cache-first, 30 days.
  {
    matcher: ({ url, request }) => request.destination === "image" && isChurchImage({ url }),
    handler: new CacheFirst({
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
      sameOrigin && request.mode === "navigate" && /\/mobile(\/|$)/.test(url.pathname),
    handler: new NetworkFirst({
      cacheName: "pages-mobile",
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 7 * 24 * 60 * 60 })
      ]
    })
  },
  // Everything else Next.js recommends (static assets, RSC, fonts, etc.).
  ...defaultCache
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: mobileRuntimeCaching
});

serwist.addEventListeners();
