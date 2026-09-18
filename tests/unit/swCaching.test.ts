import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

// Issue #1095: a church website page could keep serving pre-edit content long after the
// CMS change was published - not the usual ~30-60s propagation delay, but stuck for 12+
// hours until the visitor cleared the site's service worker caches.
//
// The service worker is registered at scope "/" from the *public* church layout (see
// src/app/[sdSlug]/(public)/layout.tsx), not just the /mobile PWA, so every public page
// request goes through it. sw.ts only ever overrode the API caches; the page markup fell
// through to @serwist/next's defaultCache, whose "others" / "pages-rsc" / "pages" entries
// are NetworkFirst with a 24h expiry. NetworkFirst falls back to the cache whenever the
// network fetch fails, and nothing evicts an entry that a later cache.put() failed to
// overwrite - so one unlucky write plus one network hiccup pins the old page for the full
// 24h TTL.
//
// These tests drive the real serwist strategies from the real runtime caching list against
// a fake CacheStorage, so they assert what the browser would actually be handed.

const SW_ORIGIN = "https://grace.b1.church";

class FakeCache {
  entries = new Map<string, Response>();
  async put(request: RequestInfo, response: Response) {
    this.entries.set(new Request(request).url, response);
  }
  async match(request: RequestInfo) {
    const hit = this.entries.get(new Request(request).url);
    return hit ? hit.clone() : undefined;
  }
  async delete(request: RequestInfo) {
    return this.entries.delete(new Request(request).url);
  }
  async keys() {
    return [...this.entries.keys()].map((url) => new Request(url));
  }
}

const cacheStorage = {
  store: new Map<string, FakeCache>(),
  async open(name: string) {
    if (!this.store.has(name)) this.store.set(name, new FakeCache());
    return this.store.get(name)!;
  },
  async match(request: RequestInfo, options?: { cacheName?: string }) {
    const cache = options?.cacheName ? this.store.get(options.cacheName) : undefined;
    return cache ? cache.match(request) : undefined;
  },
  async has(name: string) {
    return this.store.has(name);
  },
  async keys() {
    return [...this.store.keys()];
  },
  async delete(name: string) {
    return this.store.delete(name);
  }
};

// A FetchEvent stand-in: node has no ExtendableEvent, and serwist's ExpirationPlugin
// hands a best-effort IndexedDB promise to waitUntil that cannot resolve here.
class FakeFetchEvent {
  waits: Promise<unknown>[] = [];
  request: Request;
  constructor(request: Request) {
    this.request = request;
  }
  waitUntil(promise: Promise<unknown>) {
    this.waits.push(Promise.resolve(promise).catch(() => {}));
  }
  respondWith() {}
}

const globals = globalThis as Record<string, unknown>;
globals.caches = cacheStorage;
globals.self = globalThis;
globals.FetchEvent = FakeFetchEvent;
globals.location = new URL(`${SW_ORIGIN}/sw.js`);
globals.registration = { scope: `${SW_ORIGIN}/` };
// serwist's ExpirationPlugin records entry timestamps in IndexedDB. There is none here, so
// every open fails fast and `handle` below swallows that bookkeeping error. Expiry timing is
// not what these tests are about - which cache answers a request is.
class FakeIDBRequest {
  error = new Error("no IndexedDB in this environment");
  addEventListener(type: string, listener: (event: unknown) => void) {
    if (type === "error") setTimeout(() => listener({ target: this }), 0);
  }
  removeEventListener() {}
}
for (const name of ["IDBDatabase", "IDBObjectStore", "IDBIndex", "IDBCursor", "IDBTransaction"]) {
  globals[name] = class {};
}
globals.IDBRequest = FakeIDBRequest;
globals.indexedDB = { open: () => new FakeIDBRequest() };

// defaultCache collapses to a single NetworkOnly route outside production, so the module
// has to be imported with NODE_ENV=production to exercise the caching the browser sees.
process.env.NODE_ENV = "production";
const { mobileRuntimeCaching } = await import("../../src/app/swCaching.ts");

const cacheNames = () =>
  mobileRuntimeCaching
    .map((entry) => (entry.handler as { cacheName?: string }).cacheName)
    .filter((name): name is string => typeof name === "string");

/** Mirrors serwist's router: first entry whose matcher accepts the request wins. */
const resolveEntry = (request: Request, event: FakeFetchEvent) => {
  const url = new URL(request.url);
  const sameOrigin = url.origin === SW_ORIGIN;
  for (const entry of mobileRuntimeCaching) {
    const matcher = entry.matcher;
    if (matcher instanceof RegExp) {
      if (matcher.test(url.href)) return entry;
    } else if (typeof matcher === "function" && (matcher as (o: unknown) => unknown)({ request, url, event, sameOrigin })) {
      return entry;
    }
  }
  return undefined;
};

const navigationRequest = (url: string) => {
  const request = new Request(url, { headers: { Accept: "text/html,application/xhtml+xml" } });
  // Node refuses to construct a request with mode "navigate"; the browser sends one.
  Object.defineProperty(request, "mode", { value: "navigate" });
  Object.defineProperty(request, "destination", { value: "document" });
  return request;
};

const rscRequest = (url: string) => new Request(url, { headers: { RSC: "1" } });

const seedEveryCache = async (url: string, body: string) => {
  for (const name of cacheNames()) {
    const cache = await cacheStorage.open(name);
    await cache.put(new Request(url), new Response(body, { headers: { "Content-Type": "text/html" } }));
  }
};

const cachesHolding = async (url: string) => {
  const found: string[] = [];
  for (const [name, cache] of cacheStorage.store) {
    if (await cache.match(new Request(url))) found.push(name);
  }
  return found;
};

/** Runs the request through the strategy the runtime caching list picks for it. */
const handle = async (request: Request, fetchImpl: typeof fetch) => {
  globals.fetch = fetchImpl;
  const event = new FakeFetchEvent(request);
  const entry = resolveEntry(request, event);
  assert.ok(entry, `no runtime caching entry matched ${request.url}`);
  const handler = entry.handler as {
    handleAll: (o: unknown) => [Promise<Response>, Promise<void>];
    cacheName?: string;
  };
  const [responseDone, allDone] = handler.handleAll({ request, event, url: new URL(request.url) });
  let response: Response | undefined;
  let error: Error | undefined;
  try {
    response = await responseDone;
  } catch (thrown) {
    error = thrown as Error;
  }
  // Settles the background cache write so the cache assertions see its result.
  await allDone.catch(() => {});
  await Promise.all(event.waits);
  return {
    strategy: (entry.handler as object).constructor.name,
    cacheName: handler.cacheName,
    error,
    body: response ? await response.text() : undefined
  };
};

const offline: typeof fetch = async () => {
  throw new TypeError("Failed to fetch");
};
const serving = (body: string): typeof fetch =>
  (async () => new Response(body, { status: 200, headers: { "Content-Type": "text/html" } })) as typeof fetch;

beforeEach(() => {
  cacheStorage.store.clear();
});

describe("public church pages", () => {
  const pageUrl = `${SW_ORIGIN}/about-us`;

  it("never answers a page navigation with a cached copy", async () => {
    await seedEveryCache(pageUrl, "PRE-EDIT CONTENT");
    const result = await handle(navigationRequest(pageUrl), offline);
    assert.notEqual(
      result.body,
      "PRE-EDIT CONTENT",
      `stale page served from the "${result.cacheName}" cache - a published CMS edit stays invisible`
    );
  });

  it("never answers a page RSC payload with a cached copy", async () => {
    await seedEveryCache(pageUrl, "PRE-EDIT CONTENT");
    const result = await handle(rscRequest(pageUrl), offline);
    assert.notEqual(
      result.body,
      "PRE-EDIT CONTENT",
      `stale RSC payload served from the "${result.cacheName}" cache - a published CMS edit stays invisible`
    );
  });

  it("does not store page markup that could later go stale", async () => {
    const result = await handle(navigationRequest(pageUrl), serving("FRESH CONTENT"));
    assert.equal(result.body, "FRESH CONTENT");
    assert.deepEqual(await cachesHolding(pageUrl), []);
  });

  it("does not store the page RSC payload either", async () => {
    const result = await handle(rscRequest(pageUrl), serving("FRESH CONTENT"));
    assert.equal(result.body, "FRESH CONTENT");
    assert.deepEqual(await cachesHolding(pageUrl), []);
  });
});

describe("caches the public pages change must not disturb", () => {
  it("still serves the mobile app shell from cache when the network is down", async () => {
    const mobileUrl = `${SW_ORIGIN}/mobile/dashboard`;
    const cache = await cacheStorage.open("pages-mobile");
    await cache.put(new Request(mobileUrl), new Response("CACHED SHELL"));
    const result = await handle(navigationRequest(mobileUrl), offline);
    assert.equal(result.cacheName, "pages-mobile");
    assert.equal(result.body, "CACHED SHELL");
  });

  it("still caches the mobile app shell on a successful fetch", async () => {
    const mobileUrl = `${SW_ORIGIN}/mobile/dashboard`;
    const result = await handle(navigationRequest(mobileUrl), serving("SHELL"));
    assert.equal(result.body, "SHELL");
    assert.deepEqual(await cachesHolding(mobileUrl), ["pages-mobile"]);
  });

  it("still keeps auth exchanges off every cache", async () => {
    const loginUrl = "https://api.b1.church/MembershipApi/users/login";
    const result = await handle(new Request(loginUrl), serving("TOKEN"));
    assert.equal(result.strategy, "NetworkOnly");
    assert.deepEqual(await cachesHolding(loginUrl), []);
  });

  it("still routes content API reads through the api-content cache", async () => {
    const contentUrl = "https://api.b1.church/ContentApi/pages/grace";
    const result = await handle(new Request(contentUrl), serving("[]"));
    assert.equal(result.cacheName, "api-content");
    assert.deepEqual(await cachesHolding(contentUrl), ["api-content"]);
  });

  it("still caches Next static assets", async () => {
    const assetUrl = `${SW_ORIGIN}/_next/static/chunks/main-abc123.js`;
    const result = await handle(new Request(assetUrl), serving("console.log(1)"));
    assert.equal(result.cacheName, "next-static-js-assets");
  });
});
