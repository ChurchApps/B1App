import { test, expect } from "@playwright/test";

test.describe("Public site robustness", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("home page ships Church JSON-LD in the server HTML", async ({ request }) => {
    const res = await request.get("/");
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    const match = html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/);
    expect(match, "JSON-LD script should be in the SSR HTML").not.toBeNull();
    expect(JSON.parse(match![1])["@type"]).toBe("Church");
  });

  test("unknown form id shows an error instead of spinning forever", async ({ page }) => {
    await page.goto("/forms/FRMDOESNOTEXIST");
    await expect(page.locator("body")).toContainText(/could not be loaded/i, { timeout: 20000 });
  });
});
