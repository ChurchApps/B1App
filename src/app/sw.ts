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
const WEB_PUSH_SW_VERSION = "2026-05-22-webpush-frontend-1";
const WEB_PUSH_DIAGNOSTICS_CACHE = "b1-webpush-diagnostics";
const WEB_PUSH_DIAGNOSTICS_URL = "/__b1_webpush_diagnostics__";
const MAX_WEB_PUSH_DIAGNOSTICS = 50;

type DiagnosticLevel = "info" | "warn" | "error";

const postDiagnostic = async (level: DiagnosticLevel, event: string, details?: Record<string, unknown>) => {
  const entry = {
    time: new Date().toISOString(),
    source: "service-worker" as const,
    level,
    event,
    details: {
      version: WEB_PUSH_SW_VERSION,
      ...(details || {})
    }
  };

  try {
    const cache = await self.caches.open(WEB_PUSH_DIAGNOSTICS_CACHE);
    const request = new Request(WEB_PUSH_DIAGNOSTICS_URL);
    const existing = await cache.match(request);
    const entries = existing ? await existing.json() as typeof entry[] : [];
    const next = [...entries, entry].slice(-MAX_WEB_PUSH_DIAGNOSTICS);
    await cache.put(request, new Response(JSON.stringify(next), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch {
    // Diagnostics persistence is best-effort only.
  }

  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clients.forEach((client) => client.postMessage({ type: "B1_WEBPUSH_DIAGNOSTIC", entry }));
};

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

self.addEventListener("install", (event) => {
  event.waitUntil(postDiagnostic("info", "service-worker-installed", { scope: self.registration.scope }));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(postDiagnostic("info", "service-worker-activated", { scope: self.registration.scope }));
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
  // Optional navigation hints from the API:
  //  - personId: for privateMessage, the OTHER party in the chat (not the notify recipient).
  //  - conversationId: lets the chat page skip its own conversation lookup.
  //  - innerType/innerId: when type === "notification", the wrapped content's real type/id.
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
      void postDiagnostic("warn", "push-json-fallback-parse", { rawLength: rawText.length, error: String(jsonError) });
      return parsed;
    } catch (textError) {
      void postDiagnostic("error", "push-parse-failed", {
        jsonError: String(jsonError),
        textError: String(textError)
      });
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

self.addEventListener("push", (event) => {
  const payload = safeParsePushData(event);
  const title = payload.title || "B1";
  const body = payload.body || "";
  event.waitUntil(
    (async () => {
      await postDiagnostic("info", "push-received", {
        hasTitle: !!payload.title,
        hasBody: !!payload.body,
        type: payload.type || "",
        contentId: payload.contentId || "",
        channel: payload.channel || "",
        schemaVersion: payload.schemaVersion || 0
      });

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

        await postDiagnostic("info", "notification-shown", {
          title,
          type: payload.type || "",
          contentId: payload.contentId || ""
        });
      } catch (error) {
        await postDiagnostic("error", "notification-show-failed", { message: String(error) });
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
      await postDiagnostic("info", "notification-clicked", {
        target,
        type: payload.type || payload.raw?.type || "",
        contentId: payload.contentId || payload.raw?.contentId || ""
      });
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await (client as WindowClient).navigate(target);
              await postDiagnostic("info", "notification-click-navigated-existing-client", { target });
            } catch {
              await postDiagnostic("warn", "notification-click-navigate-existing-client-failed", { target });
            }
          }
          return;
        }
      }
      await self.clients.openWindow(target);
      await postDiagnostic("info", "notification-click-opened-new-window", { target });
    })()
  );
});

self.addEventListener("message", (event) => {
  const data = event.data as { type?: string } | undefined;
  if (!data?.type) return;

  if (data.type === "B1_SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "B1_WEBPUSH_DIAGNOSTICS_PING" && event.ports?.[0]) {
    event.ports[0].postMessage({
      version: WEB_PUSH_SW_VERSION,
      scope: self.registration.scope
    });
  }
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(postDiagnostic("warn", "push-subscription-changed"));
});
