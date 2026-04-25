import { test, expect } from "@playwright/test";

// Smaller mobile screens — notifications, registrations, volunteer.
// Each just needs to load without crashing.

test.describe("Mobile notifications", () => {
  test("notifications page loads", async ({ page }) => {
    await page.goto("/mobile/notifications");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });
});

test.describe("Mobile registrations", () => {
  test("registrations page loads", async ({ page }) => {
    await page.goto("/mobile/registrations");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });
});

test.describe("Mobile volunteer", () => {
  test("volunteer page loads", async ({ page }) => {
    await page.goto("/mobile/volunteer");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });

  test("legacy /mobile/volunteerBrowse slug routes to volunteer", async ({ page }) => {
    await page.goto("/mobile/volunteerBrowse");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });
});
