import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile content screens", () => {
  test("sermons screen loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/sermons");
    await expect(mobileLogoutButton(page)).toBeVisible();
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
});
