import { test, expect } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// Issue #1166 / #1167: the subdomain rewrite sent /api/revalidate/{sd} to /{sd}/api/revalidate/{sd},
// so the site cache clear B1Admin fires after saving the announcement bar returned 404.
test("site cache clear reaches the revalidate route on a church subdomain", async ({ request }) => {
  const res = await request.post("/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ revalidated: true });
});
