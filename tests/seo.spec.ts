import { test, expect } from "@playwright/test";

// What a crawler sees: the server HTML, before any JavaScript runs.
const metaContent = (html: string, name: string) => html.match(new RegExp(`<meta[^>]*name="${name}"[^>]*content="([^"]*)"`))?.[1];
const titleOf = (html: string) => html.match(/<title>([^<]*)<\/title>/)?.[1];
const h1Count = (html: string) => (html.match(/<h1[\s>]/g) || []).length;
const h1Text = (html: string) => html.match(/<h1[^>]*>([^<]*)</)?.[1];

// Church sites send their canonical as a Link header from middleware, on whatever host the church is served from.
test.describe("SEO", () => {
  for (const path of ["/", "/about", "/sermons/SER00000007"]) {
    test(`${path} names itself as canonical`, async ({ request, baseURL }) => {
      const response = await request.get(path + "?utm_source=test");
      expect(response.status()).toBe(200);
      expect(response.headers()["link"]).toContain(`<${new URL(path, baseURL).href}>; rel="canonical"`);
    });
  }

  test("the member portal gets no canonical", async ({ request }) => {
    const response = await request.get("/login");
    expect(response.headers()["link"] || "").not.toContain("canonical");
  });

  test("the Bible page renders on the server", async ({ request }) => {
    const response = await request.get("/bible");
    expect(response.status()).toBe(200);
    expect(h1Count(await response.text())).toBe(1);
  });

  test("church pages never fall back to the B1.church product description", async ({ request }) => {
    for (const path of ["/groups", "/groups/small-group", "/blog"]) {
      const html = await (await request.get(path)).text();
      const description = metaContent(html, "description") || "";
      expect(description, path).not.toContain("B1.church");
      expect(description, path).not.toBe("");
    }
  });

  test("a group label page has its own title", async ({ request }) => {
    const home = titleOf(await (await request.get("/")).text());
    const label = titleOf(await (await request.get("/groups/small-group")).text());
    expect(label).toContain("Small Group");
    expect(label).not.toBe(home);
  });

  for (const path of ["/groups", "/volunteer"]) {
    test(`${path} has exactly one h1 in the server HTML`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      expect(h1Count(await response.text())).toBe(1);
    });
  }

  // Client components render before the browser loads its labels, so the server HTML used to carry the raw key.
  for (const [path, heading] of [["/groups", "Find a Group"], ["/volunteer", "Volunteer Opportunities"]]) {
    test(`${path} h1 is a real heading, not a locale key`, async ({ request }) => {
      expect(h1Text(await (await request.get(path)).text())).toBe(heading);
    });
  }

  test("an unknown registration event is a real 404", async ({ request }) => {
    const response = await request.get("/register/missing-" + Date.now());
    expect(response.status()).toBe(404);
  });

  test("the sitemap lists the built-in listing pages and sermon dates", async ({ request, baseURL }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const entries = [...xml.matchAll(/<url><loc>([^<]*)<\/loc>(?:<lastmod>([^<]*)<\/lastmod>)?<\/url>/g)].map((m) => ({ loc: m[1], lastmod: m[2] }));
    const locs = entries.map((e) => e.loc);
    for (const path of ["/sermons", "/groups", "/volunteer"]) expect(locs, path).toContain(new URL(path, baseURL).href);
    const sermon = entries.find((e) => e.loc.includes("/sermons/SER"));
    expect(sermon?.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  test("an event page describes itself as an Event", async ({ request }) => {
    const response = await request.get("/events/EVT00000001");
    expect(response.status()).toBe(200);
    const blocks = [...(await response.text()).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const event = blocks.find((b) => b["@type"] === "Event");
    expect(event?.name).toBe("Sunday Morning Service");
    expect(event?.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(event?.location?.name).toBe("Grace Community Church");
  });

  test("an unknown stream page is a real 404", async ({ request }) => {
    const response = await request.get("/stream/missing-" + Date.now());
    expect(response.status()).toBe(404);
  });
});
