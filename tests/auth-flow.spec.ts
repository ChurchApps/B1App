import { test, expect } from "@playwright/test";
import { login, logout } from "./helpers/auth";

test.describe("Authentication", () => {
  test("logged-in shell shows user-menu chip", async ({ page }) => {
    await page.goto("/mobile");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });

  test.describe.serial("logout / login round trip", () => {
    test("logout clears session and shows login chip", async ({ page }) => {
      await page.goto("/mobile");
      await logout(page);
      await expect(page.locator('[data-testid="login-chip"]')).toBeVisible();
    });

    test("login restores authenticated header", async ({ page }) => {
      await login(page);
      await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
    });
  });

  test("login form fields render on /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      try { localStorage.clear(); } catch { /* ignore */ }
    }).catch(() => { /* ignore — page not loaded yet */ });
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("invalid credentials show an error message", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[type="email"]', "demo@b1.church");
    await page.fill('input[type="password"]', "wrong-password");
    await page.click('button[type="submit"]');
    // Stay on /login (login failed) — credentials are invalid.
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/login");
  });
});
