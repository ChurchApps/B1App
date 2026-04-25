import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// DonatePage shows the donation form for authenticated users.
// Funds are seeded in giving/demo.sql.

test.describe("Mobile donate", () => {
  test("donate page loads for authenticated user", async ({ page }) => {
    await page.goto("/mobile/donate");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page).toHaveURL(/\/mobile\/donate/);
  });

  test("legacy /mobile/donation slug routes to donate", async ({ page }) => {
    await page.goto("/mobile/donation");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });
});
