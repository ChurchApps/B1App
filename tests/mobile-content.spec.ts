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
    await expect(page.locator("body")).toContainText(SEED_PLAYLISTS.SUNDAY_SERMONS.title, {
      timeout: 15000,
    });
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

  test("clicking a sermon playlist on /mobile/sermons drills into its sermons", async ({
    page,
  }) => {
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
