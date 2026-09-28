import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";
import { SEED_PLAYLISTS } from "./helpers/fixtures";

test.describe("Mobile content screens", () => {
  test("sermons screen loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/sermons");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("sermons screen lists seeded playlist titles", async ({ page }) => {
    await page.goto("/mobile/sermons");
    await expect(page.locator("body")).toContainText(SEED_PLAYLISTS.SUNDAY_SERMONS.title, { timeout: 15000 });
  });

  test("bible screen renders", async ({ page }) => {
    await page.goto("/mobile/bible");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("stream screen renders", async ({ page }) => {
    await page.goto("/mobile/stream");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("lessons screen renders", async ({ page }) => {
    await page.goto("/mobile/lessons");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("votd screen renders", async ({ page }) => {
    await page.goto("/mobile/votd");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("votd share image hands the day's picture to the share sheet as a file", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any;
      w.__sharedFiles = null;
      Object.defineProperty(navigator, "canShare", { configurable: true, value: (data: any) => !!data?.files?.length });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: any) => {
          w.__sharedFiles = (data.files || []).map((f: File) => ({ name: f.name, type: f.type, size: f.size }));
          w.__sharedText = data.text;
        }
      });
    });
    await page.goto("/mobile/votd");
    const button = page.getByTestId("votd-share-image");
    await expect(button).toBeVisible({ timeout: 15000 });
    await button.click();
    await expect.poll(() => page.evaluate(() => (window as any).__sharedFiles), { timeout: 20000 }).not.toBeNull();
    const files = await page.evaluate(() => (window as any).__sharedFiles);
    expect(files).toHaveLength(1);
    expect(files[0].type).toBe("image/jpeg");
    expect(files[0].name).toBe("verse-of-the-day.jpg");
    expect(files[0].size).toBeGreaterThan(1000);
    expect(await page.evaluate(() => (window as any).__sharedText)).toMatch(/—/);
  });

  test("votd image route serves only real days and shapes", async ({ page }) => {
    const ok = await page.request.get("/mobile/votd-image/100/9x16");
    expect(ok.status()).toBe(200);
    expect(ok.headers()["content-type"]).toContain("image/jpeg");
    expect((await page.request.get("/mobile/votd-image/0/9x16")).status()).toBe(404);
    expect((await page.request.get("/mobile/votd-image/367/1x1")).status()).toBe(404);
    expect((await page.request.get("/mobile/votd-image/100/foo")).status()).toBe(404);
  });

  test("clicking a sermon playlist on /mobile/sermons drills into its sermons", async ({ page }) => {
    // Per b1-mobile/content/sermons.md, sermons screen lets you drill into a
    // playlist. SermonsPage routes to /mobile/playlist/<id> on click.
    await page.goto("/mobile/sermons");
    const card = page.locator("main").getByText(/Sunday Sermons 2025-2026/i).first();
    await card.waitFor({ state: "visible", timeout: 15000 });
    await card.click();
    await expect(page).toHaveURL(/\/mobile\/playlist\/PLY\d+/, { timeout: 15000 });
    await expect(page.locator("main")).toContainText(/The Power of Faith/i, { timeout: 15000 });
  });
});
