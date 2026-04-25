import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// /mobile is the entry point — redirects to /mobile/dashboard.

test.describe("Mobile shell", () => {
  test("/mobile redirects to /mobile/dashboard", async ({ page }) => {
    await page.goto("/mobile");
    await expect(page).toHaveURL(/\/mobile\/dashboard/);
  });

  test("dashboard shows logged-in chrome (Logout button)", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("unknown mobile slug renders placeholder, not 404", async ({ page }) => {
    await page.goto("/mobile/this-screen-does-not-exist");
    await expect(page.locator("body")).toContainText(/not yet implemented/i);
  });
});
