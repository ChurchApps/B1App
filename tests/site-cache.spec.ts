import { test, expect } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

test.describe("Site cache", () => {
  // The subdomain rewrite must leave /api routes alone, or the cache clear B1Admin fires
  // after a site save is rewritten to /{sd}/api/revalidate/{sd} and returns 404.
  test("cache clear reaches the revalidate route on a church subdomain", async ({ request }) => {
    const res = await request.post("/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ revalidated: true });
  });
});
