import { test, expect } from "@playwright/test";

// /mobile is the entry point — redirects to /mobile/dashboard.
// The mobile shell renders the user-menu chip when authenticated.

test.describe("Mobile shell", () => {
  test("/mobile redirects to /mobile/dashboard", async ({ page }) => {
    await page.goto("/mobile");
    await expect(page).toHaveURL(/\/mobile\/dashboard/);
  });

  test("dashboard shows authenticated header", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });

  test("unknown mobile slug renders placeholder, not 404", async ({ page }) => {
    await page.goto("/mobile/this-screen-does-not-exist");
    // ScreenRouter falls through to PlaceholderPage rather than notFound().
    await expect(page.locator("body")).toContainText(/not yet implemented/i);
  });
});
