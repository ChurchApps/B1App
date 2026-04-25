import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Per b1-mobile/checkin/self-checkin.md, CheckinPage walks through:
//   Step 1: Choose Service → Step 2: Household → Step 3: Groups → Step 4: Confirmation
// Default attendance/demo.sql does not seed an active service window, so we
// expect the "No Services Available" empty state at step 1.

test.describe("Mobile checkin", () => {
  test("checkin page loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/checkin");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("legacy /mobile/service slug routes to checkin", async ({ page }) => {
    await page.goto("/mobile/service");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("renders services list or No Services Available empty state", async ({ page }) => {
    await page.goto("/mobile/checkin");
    // Either we have a service to choose, or the empty state shows.
    await expect(page.locator("main")).toContainText(
      /No Services Available|Choose Service|Select a Service|Sunday/i,
      { timeout: 15000 }
    );
  });
});
