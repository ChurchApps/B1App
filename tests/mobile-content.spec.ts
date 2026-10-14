import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";
import { SEED_PLAYLISTS } from "./helpers/fixtures";

test.describe("Mobile content screens", () => {
  test("sermons screen loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/sermons");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("sermons screen shows Recent and Series sections instead of tabs", async ({ page }) => {
    await page.goto("/mobile/sermons");
    await expect(page.getByRole("heading", { level: 1, name: "Sermons" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("region", { name: "Recent" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("region", { name: "Series" })).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(0);
  });

  test("sermons screen lists seeded playlist titles in All series", async ({ page }) => {
    await page.goto("/mobile/sermons");
    await page.getByRole("region", { name: "Series" }).getByRole("button", { name: "All series" }).click({ timeout: 15000 });
    await expect(page).toHaveURL(/view=series/);
    await expect(page.getByRole("heading", { level: 1, name: "All series" })).toBeVisible();
    await expect(page.locator("main")).toContainText(SEED_PLAYLISTS.SUNDAY_SERMONS.title, { timeout: 15000 });
    await page.getByRole("button", { name: /Back to Sermons/ }).click();
    await expect(page).not.toHaveURL(/view=series/);
  });

  test("All sermons slice searches across years", async ({ page }) => {
    await page.goto("/mobile/sermons");
    await page.getByRole("button", { name: "All sermons" }).click({ timeout: 15000 });
    await expect(page).toHaveURL(/view=all/);
    const search = page.getByRole("textbox", { name: /Search sermons/i });
    await search.fill("Power of Faith");
    await expect(page.locator("main").getByRole("link", { name: /The Power of Faith/i })).toBeVisible({ timeout: 15000 });
  });

  test("bible screen renders", async ({ page }) => {
    await page.goto("/mobile/bible");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("stream screen renders", async ({ page }) => {
    await page.goto("/mobile/stream");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /Stream/ })).toContainText(/Live|Offline/, { timeout: 15000 });
    await expect(page.locator("#streamingAltTabs")).toHaveCount(0);
  });

  test("lessons screen renders", async ({ page }) => {
    await page.goto("/mobile/lessons");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("votd screen renders", async ({ page }) => {
    await page.goto("/mobile/votd");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Verse of the Day" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share Verse of the Day" })).toBeVisible();
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
    await page.goto("/mobile/sermons?view=series");
    const row = page.locator("main").getByRole("link", { name: /Sunday Sermons 2025-2026/i });
    await row.waitFor({ state: "visible", timeout: 15000 });
    await row.click();
    await expect(page).toHaveURL(/\/mobile\/playlist\/PLY\d+/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1, name: SEED_PLAYLISTS.SUNDAY_SERMONS.title })).toBeVisible({ timeout: 15000 });
    await expect(page.locator("main")).toContainText(/The Power of Faith/i, { timeout: 15000 });
  });

  test("sermon detail puts the player first with text-link verbs", async ({ page }) => {
    await page.goto("/mobile/sermons/SER00000001");
    await expect(page.getByRole("heading", { level: 1, name: /The Power of Faith/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /Watch Sermon/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Share$/ })).toBeVisible();
    await expect(page.getByRole("region", { name: "In this series" }).getByRole("link", { name: "All in series" })).toHaveAttribute("href", /\/mobile\/playlist\/PLY00000001/);
  });
});
