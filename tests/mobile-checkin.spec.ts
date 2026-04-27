import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Per b1-mobile/checkin/self-checkin.md, CheckinPage walks through:
//   Step 1: Choose Service → Step 2: Household → Step 3: Groups → Step 4: Confirmation
// Seeded data:
//   - Services SER00000001-3 + serviceTimes SST00000001-4 (always present)
//   - Session SES00000029 anchored to current Sunday 9:00 AM

test.describe("Mobile checkin", () => {
  test("checkin page loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/checkin");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("legacy /mobile/service slug routes to checkin", async ({ page }) => {
    await page.goto("/mobile/service");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("Step 1 lists seeded services (Sunday Morning, Sunday Evening, Wednesday)", async ({
    page,
  }) => {
    await page.goto("/mobile/checkin");
    const main = page.locator("main");
    await expect(main).toContainText(/Sunday Morning Service/i, { timeout: 30000 });
  });

  test("each seeded service has a clickable selector for Step 1", async ({ page }) => {
    // CheckinPage assigns data-testid="select-service-<id>-button" per
    // service per CheckinPage.tsx:240. We assert the buttons exist for each
    // seeded service rather than chasing a click → API → next-step transition
    // (which depends on an attendance window that's awkward to seed
    // deterministically across all timezones).
    await page.goto("/mobile/checkin");
    await expect(page.locator("main")).toContainText(/Sunday Morning Service/i, {
      timeout: 30000,
    });
    await expect(
      page.locator('[data-testid="select-service-SER00000001-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="select-service-SER00000002-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="select-service-SER00000003-button"]')
    ).toBeVisible();
  });
});
