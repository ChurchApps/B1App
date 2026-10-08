import { test, expect } from "@playwright/test";
import { DEMO_CHURCH, SEED_PLAYLISTS, SEED_SERMONS } from "./helpers/fixtures";
import { getApi, apiCall } from "./helpers/api";

const MAIN_API = process.env.API_BASE || "http://localhost:8084";

test.describe("Public sermons page", () => {
  // The redirect test briefly takes over /sermons, so keep this file's tests in order on one worker.
  test.describe.configure({ mode: "default" });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("renders sermons heading", async ({ page }) => {
    await page.goto("/sermons");
    await expect(page.locator("h1").filter({ hasText: /^Sermons$/i }).first()).toBeVisible();
  });

  test("a saved redirect for /sermons wins over the built-in Sermons page", async ({ page }) => {
    const api = await getApi("demo");
    const target = "https://www.youtube.com/@gracecommunity-sermons";
    const saved = await apiCall(api, "post", `${MAIN_API}/content/redirects`, [{ fromPath: "/sermons", toPath: target }]);
    expect(saved.ok()).toBeTruthy();
    const [redirect] = await saved.json();

    try {
      const res = await page.request.get("/sermons", { maxRedirects: 0 });
      expect(res.status()).toBe(308);
      expect(res.headers()["location"]).toBe(target);
    } finally {
      await apiCall(api, "delete", `${MAIN_API}/content/redirects/${redirect.id}`);
    }
  });

  test("shows seeded playlists in the default view", async ({ page }) => {
    await page.goto("/sermons");
    const body = page.locator("body");
    await expect(body).toContainText(/Sunday Sermons 2025-2026/i, { timeout: 15000 });
    await expect(body).toContainText(/Special Services/i);
    await expect(body).toContainText(/Bible Study Series/i);
  });

  test("Playlists toggle is visible", async ({ page }) => {
    await page.goto("/sermons");
    await expect(page.locator("button, a").filter({ hasText: /^Playlists$/ }).first()).toBeVisible({ timeout: 15000 });
  });

  test("clicking a playlist drills into its sermon list", async ({ page }) => {
    await page.goto("/sermons");
    const playlistCard = page.locator("body").getByText(SEED_PLAYLISTS.SUNDAY_SERMONS.title).first();
    await playlistCard.waitFor({ state: "visible", timeout: 15000 });
    await playlistCard.click();
    await expect(page.locator("body")).toContainText(SEED_SERMONS.YOUTUBE_RECENT.title, { timeout: 15000 });
  });

  test("sermon page advertises the podcast RSS feed", async ({ page }) => {
    await page.goto("/sermons/" + SEED_SERMONS.YOUTUBE_RECENT.id);
    await expect(page.locator("h1").filter({ hasText: SEED_SERMONS.YOUTUBE_RECENT.title }).first()).toBeVisible({ timeout: 15000 });
    const rssLink = page.locator('link[rel="alternate"][type="application/rss+xml"]').first();
    await expect(rssLink).toHaveCount(1);
    expect(await rssLink.getAttribute("href")).toContain("/sermons/rss/" + DEMO_CHURCH.ID);
  });
});
