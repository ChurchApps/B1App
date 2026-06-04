/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import {
  Serwist,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
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
serwist.setCatchHandler(async ({ request, url }) => {
  if (request.mode === "navigate" && /\/mobile(\/|$)/.test(url.pathname)) {
    const directMatch = await self.caches.match(request);
    if (directMatch) return directMatch;

    const dashboardMatch = await self.caches.match("/mobile/dashboard");
    if (dashboardMatch) return dashboardMatch;

    if (url.pathname !== "/mobile/dashboard") {
      return Response.redirect("/mobile/dashboard", 302);
    }
  }

  return Response.error();
});

interface PushPayload {
  title?: string;
  body?: string;
  type?: string;
  contentId?: string;
  sentAt?: string;
  channel?: string;
  schemaVersion?: number;
  url?: string;
  link?: string;
  badgeCount?: number;
  personId?: string;
  conversationId?: string;
  innerType?: string;
  innerId?: string;
}

const safeParsePushData = (event: PushEvent): PushPayload => {
  if (!event.data) return {};

  try {
    return event.data.json() as PushPayload;
  } catch (jsonError) {
    try {
      const rawText = event.data.text();
      const parsed = JSON.parse(rawText) as PushPayload;
      return parsed;
    } catch (textError) {
      console.error("[webpush] push payload parse failed:", { jsonError, textError });
      return { body: event.data.text() };
    }
  }
};

const buildUrlForType = (type: string, id: string | undefined, payload: PushPayload): string | null => {
  switch (type) {
    case "plan":
    case "schedule": return id ? `/mobile/plans/${id}` : null;
    case "groupannouncement": return id ? `/mobile/groups/${id}?openChat=1&chatTab=announcements` : null;
    case "group": return id ? `/mobile/groups/${id}` : null;
    case "assignment": return "/mobile/plans";
    case "privatemessage": {
      // Route's [id] is the other person's personId; conversationId is honored as a query param.
      const personId = payload.personId || id;
      if (!personId) return null;
      const convId = payload.conversationId || (payload.personId ? id : undefined);
      return convId ? `/mobile/messages/${personId}?conversationId=${convId}` : `/mobile/messages/${personId}`;
    }
  }
  return null;
};

const deriveClickUrl = (payload: PushPayload): string => {
  const directUrl = payload.url || payload.link;
  if (typeof directUrl === "string" && directUrl.trim()) return directUrl;

  const type = String(payload.type || "").toLowerCase();

  // Generic notification wrapper: forward to the real inner content if provided.
  if (type === "notification" && payload.innerType) {
    const innerUrl = buildUrlForType(String(payload.innerType).toLowerCase(), payload.innerId, payload);
    if (innerUrl) return innerUrl;
  }

  const direct = buildUrlForType(type, payload.contentId, payload);
  if (direct) return direct;

  return "/mobile/notifications";
};

type BadgingWorkerNavigator = WorkerNavigator & {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

const updateAppBadge = async (count: number) => {
  const normalized = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  const nav = navigator as BadgingWorkerNavigator;

  try {
    if (normalized > 0) {
      if ("setAppBadge" in navigator && typeof nav.setAppBadge === "function") await nav.setAppBadge(normalized);
    } else if ("clearAppBadge" in navigator && typeof nav.clearAppBadge === "function") {
      await nav.clearAppBadge();
    }
  } catch {
    // Badging is best-effort.
  }
};

self.addEventListener("push", (event) => {
  const payload = safeParsePushData(event);
  const title = payload.title || "B1";
  const body = payload.body || "";
  event.waitUntil(
    (async () => {
      try {
        await self.registration.showNotification(title, {
          body,
          icon: "/images/logo-icon.png",
          badge: "/images/logo-icon.png",
          data: {
            ...payload,
            url: deriveClickUrl(payload),
            raw: payload
          },
          tag: payload.type && payload.contentId ? `${payload.type}:${payload.contentId}` : undefined
        });

        if (typeof payload.badgeCount === "number") await updateAppBadge(payload.badgeCount);
      } catch (error) {
        console.error("[webpush] failed to show notification:", error);
        throw error;
      }
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const payload = (event.notification.data || {}) as PushPayload & { raw?: PushPayload };
  const target = typeof payload.url === "string" && payload.url
    ? payload.url
    : deriveClickUrl(payload.raw || payload);
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await (client as WindowClient).navigate(target);
            } catch {
              // If navigating an existing client fails, focus it and stop there.
            }
          }
          return;
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});

self.addEventListener("message", (event) => {
  const data = event.data as { type?: string } | undefined;
  if (!data?.type) return;

  if (data.type === "B1_SKIP_WAITING") {
    self.skipWaiting();
  }
});
