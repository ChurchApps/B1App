import { test, expect } from "@playwright/test";
import { mobileSignedInChrome } from "./helpers/mobile";

// Issue #1295: refreshing /mobile signed the member out. Dev hides this because
// Strict Mode runs effects twice; the red run is against `next start`.
test.use({ storageState: { cookies: [], origins: [] } });

test("a member stays signed in after refreshing the mobile app", async ({ page }) => {
  await page.goto("/mobile/login");
  await page.locator('input[type="email"]').first().fill("demo@b1.church");
  await page.locator('input[type="password"]').first().fill("password");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });
  await expect(mobileSignedInChrome(page)).toBeVisible({ timeout: 20000 });

  await page.reload();
  await expect(mobileSignedInChrome(page)).toBeVisible({ timeout: 20000 });
});
