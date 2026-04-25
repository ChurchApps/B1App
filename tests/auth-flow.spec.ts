import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Authentication is established via global-setup.ts which logs in once and
// saves storage state. Tests inherit that state by default; tests that need
// the anonymous shell call `clearCookies` first.

test.describe("Authentication", () => {
  test("logged-in user lands on the mobile dashboard with Logout chrome", async ({ page }) => {
    await page.goto("/mobile");
    await expect(page).toHaveURL(/\/mobile\/dashboard/);
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("login form fields render on /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("invalid credentials keep the user on /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[type="email"]', "demo@b1.church");
    await page.fill('input[type="password"]', "wrong-password");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/login");
  });

  test("anonymous user sees login-chip on public site header", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await expect(page.locator('[data-testid="login-chip"]')).toBeVisible({ timeout: 15000 });
  });
});
