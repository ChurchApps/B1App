import { test, expect } from "@playwright/test";
import { SEED_SERMONS } from "./helpers/fixtures";

// Content screens — Sermons, Bible, Stream, Lessons, VOTD — each render
// without requiring user-specific data.

test.describe("Mobile content screens", () => {
  test("sermons screen lists seeded sermons", async ({ page }) => {
    await page.goto("/mobile/sermons");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
    await expect(page.locator("body")).toContainText(SEED_SERMONS.YOUTUBE_RECENT.title, {
      timeout: 10000,
    });
  });

  test("bible screen renders", async ({ page }) => {
    await page.goto("/mobile/bible");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });

  test("stream screen renders", async ({ page }) => {
    await page.goto("/mobile/stream");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });

  test("lessons screen renders", async ({ page }) => {
    await page.goto("/mobile/lessons");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });

  test("votd screen renders", async ({ page }) => {
    await page.goto("/mobile/votd");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });
});
