import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile notifications", () => {
  test("notifications page loads", async ({ page }) => {
    await page.goto("/mobile/notifications");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });
});

test.describe("Mobile registrations", () => {
  test("registrations page loads", async ({ page }) => {
    await page.goto("/mobile/registrations");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });
});

test.describe("Mobile volunteer", () => {
  test("volunteer page loads", async ({ page }) => {
    await page.goto("/mobile/volunteer");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("legacy /mobile/volunteerBrowse slug routes to volunteer", async ({ page }) => {
    await page.goto("/mobile/volunteerBrowse");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });
});
