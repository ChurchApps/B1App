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

  test("an audio-only sermon's page has an audio player", async ({ page }) => {
    const api = await getApi("demo", "ContentApi");
    const unique = `Audio sermon ${Date.now()}`;
    const audioUrl = `https://example.com/${Date.now()}.mp3`;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const saved = await apiCall(api, "post", `${MAIN_API}/content/sermons`, [{ churchId: api.churchId, title: unique, audioUrl, publishDate: yesterday, playlistId: SEED_PLAYLISTS.SUNDAY_SERMONS.id }]);
    expect(saved.ok()).toBeTruthy();
    const sermonId = (await saved.json())[0].id as string;
    try {
      await page.request.post("/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
      await page.goto(`/sermons/${sermonId}`);
      await expect(page.locator("h1").filter({ hasText: unique })).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("sermon-audio")).toHaveAttribute("src", audioUrl);
    } finally {
      await apiCall(api, "delete", `${MAIN_API}/content/sermons/${sermonId}`);
      await page.request.post("/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
    }
  });

  test("an audio sermon's page offers Share and Download audio", async ({ page }) => {
    const api = await getApi("demo", "ContentApi");
    const unique = `Shared audio sermon ${Date.now()}`;
    const audioUrl = `https://example.com/${Date.now()}.mp3`;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const saved = await apiCall(api, "post", `${MAIN_API}/content/sermons`, [{ churchId: api.churchId, title: unique, audioUrl, publishDate: yesterday, playlistId: SEED_PLAYLISTS.SUNDAY_SERMONS.id }]);
    expect(saved.ok()).toBeTruthy();
    const sermonId = (await saved.json())[0].id as string;
    try {
      // Record what the share sheet would receive instead of opening it.
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "share", { configurable: true, value: async (data: unknown) => { (window as unknown as { __shared: unknown }).__shared = data; } });
      });
      await page.request.post("/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
      await page.goto(`/sermons/${sermonId}`);
      await expect(page.locator("h1").filter({ hasText: unique })).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("sermon-download")).toHaveAttribute("href", new RegExp(`/sermons/public/download/${api.churchId}/${sermonId}$`));
      await page.getByTestId("sermon-share").click();
      await expect.poll(() => page.evaluate(() => (window as unknown as { __shared?: { url?: string } }).__shared?.url)).toMatch(new RegExp(`/sermons/${sermonId}$`));
      expect(await page.evaluate(() => (window as unknown as { __shared?: { title?: string } }).__shared?.title)).toBe(unique);
    } finally {
      await apiCall(api, "delete", `${MAIN_API}/content/sermons/${sermonId}`);
      await page.request.post("/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
    }
  });

  test("/sermons/latest redirects to the newest sermon, which shows its playlist image when it has none", async ({ page }) => {
    const api = await getApi("demo", "ContentApi");
    const unique = `Latest sermon ${Date.now()}`;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const saved = await apiCall(api, "post", `${MAIN_API}/content/sermons`, [{ churchId: api.churchId, title: unique, videoType: "youtube", videoData: "dQw4w9WgXcQ", publishDate: yesterday, playlistId: SEED_PLAYLISTS.SUNDAY_SERMONS.id }]);
    expect(saved.ok()).toBeTruthy();
    const sermonId = (await saved.json())[0].id as string;
    try {
      // The sermon list is cached per church; clear it the way a B1Admin save does.
      await page.request.post("/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
      await expect.poll(async () => {
        const res = await page.request.get("/sermons/latest", { maxRedirects: 0 });
        return res.status() + " " + (res.headers()["location"] || "");
      }, { timeout: 30000 }).toMatch(new RegExp(`^30[78] .*/sermons/${sermonId}$`));

      await page.goto("/sermons/latest");
      await expect(page).toHaveURL(new RegExp(`/sermons/${sermonId}$`));
      await expect(page.locator("h1").filter({ hasText: unique })).toBeVisible({ timeout: 15000 });
      await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /sunday-sermons\.jpg/);
    } finally {
      await apiCall(api, "delete", `${MAIN_API}/content/sermons/${sermonId}`);
      await page.request.post("/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
    }
  });

  test("sermon page advertises the podcast RSS feed", async ({ page }) => {
    await page.goto("/sermons/" + SEED_SERMONS.YOUTUBE_RECENT.id);
    await expect(page.locator("h1").filter({ hasText: SEED_SERMONS.YOUTUBE_RECENT.title }).first()).toBeVisible({ timeout: 15000 });
    const rssLink = page.locator('link[rel="alternate"][type="application/rss+xml"]').first();
    await expect(rssLink).toHaveCount(1);
    expect(await rssLink.getAttribute("href")).toContain("/sermons/rss/" + DEMO_CHURCH.ID);
  });
});
