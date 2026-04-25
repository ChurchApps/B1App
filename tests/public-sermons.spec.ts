import { test, expect } from "@playwright/test";
import { SEED_SERMONS } from "./helpers/fixtures";

// /sermons renders the SermonsPage built-in component which lists sermons
// from content/demo.sql:516. SermonElement is a client component pulling
// from /sermons/{churchId}/public.

test.describe("Public sermons page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("renders sermons heading", async ({ page }) => {
    await page.goto("/sermons");
    await expect(page.locator("h1").filter({ hasText: /^Sermons$/i }).first()).toBeVisible();
  });

  test("shows at least one seeded sermon title", async ({ page }) => {
    await page.goto("/sermons");
    // SermonElement loads asynchronously — wait for any seeded title to appear.
    const anyTitle = page
      .locator("body")
      .filter({ hasText: SEED_SERMONS.YOUTUBE_RECENT.title })
      .first();
    await expect(anyTitle).toBeVisible({ timeout: 10000 });
  });

  test("lists multiple sermons", async ({ page }) => {
    await page.goto("/sermons");
    const body = page.locator("body");
    await expect(body).toContainText(SEED_SERMONS.YOUTUBE_RECENT.title, { timeout: 10000 });
    await expect(body).toContainText(SEED_SERMONS.VIMEO_SPECIAL.title);
  });
});
