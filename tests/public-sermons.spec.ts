import { test, expect } from "@playwright/test";
import { SEED_PLAYLISTS, SEED_SERMONS } from "./helpers/fixtures";

test.describe("Public sermons page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("renders sermons heading", async ({ page }) => {
    await page.goto("/sermons");
    await expect(page.locator("h1").filter({ hasText: /^Sermons$/i }).first()).toBeVisible();
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
});
