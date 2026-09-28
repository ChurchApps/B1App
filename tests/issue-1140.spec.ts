import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Issue 1140: a member signed in on /mobile goes to the church website and is shown
// as logged out. Mobile login writes a valid `jwt` cookie, but the website pages
// never restored the session from it, so the header offered "Login" and the member
// had to sign in again.
test.use({ storageState: { cookies: [], origins: [] } });

test("a member signed in on /mobile stays signed in on the website and back", async ({ page }) => {
  await page.goto("/mobile/login");
  await page.locator('input[type="email"]').first().fill("demo@b1.church");
  await page.locator('input[type="password"]').first().fill("password");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });

  await page.reload();
  await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 20000 });

  await page.goto("/");
  await expect(page.getByTestId("user-menu-chip")).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("login-chip")).toHaveCount(0);

  await page.goto("/mobile/dashboard");
  await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 20000 });
});
