import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// CheckinPage walks through services → household → groups → complete.
// Whether it shows services depends on whether attendance/demo.sql seeds an
// active service window — assert that the page loads without errors.

test.describe("Mobile checkin", () => {
  test("checkin page loads without error", async ({ page }) => {
    await page.goto("/mobile/checkin");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/error/i);
  });

  test("legacy /mobile/service slug routes to checkin", async ({ page }) => {
    await page.goto("/mobile/service");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });
});
