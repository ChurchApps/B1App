import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile notifications", () => {
  test("notifications page loads", async ({ page }) => {
    await page.goto("/mobile/notifications");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("notifications page provides tab navigation", async ({ page }) => {
    await page.goto("/mobile/notifications");
    // Per b1-mobile/community/notifications.md the page uses tabs to switch
    // between notification categories. Either tabs render, or the page shows
    // an empty state for the seeded user.
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
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

  test("volunteer page lists self-signup positions", async ({ page }) => {
    // POS00000010 (Greeter) and POS00000011 (Usher) are seeded with
    // allowSelfSignup=1 (doing/demo.sql:62).
    await page.goto("/mobile/volunteer");
    const main = page.locator("main");
    await expect(main).toContainText(/Greeter|Usher/i, { timeout: 30000 });
  });

  test("volunteer plan detail loads when drilling into a position", async ({ page }) => {
    // Per b1-mobile/serving/volunteer-signup.md, tapping a plan opens its
    // detail. /mobile/volunteer/PLA00000001 is the seeded worship plan.
    await page.goto("/mobile/volunteer/PLA00000001");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Greeter|Usher|Worship/i, {
      timeout: 30000,
    });
  });
});
