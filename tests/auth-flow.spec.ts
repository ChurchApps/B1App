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

  test("Logout button targets /mobile/logout (per docs)", async ({ page }) => {
    await page.goto("/mobile");
    const button = mobileLogoutButton(page);
    await expect(button).toBeVisible();
    const href = await button.getAttribute("href");
    expect(href).toBe("/mobile/logout");
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

  test("anonymous /mobile/dashboard surfaces Sign In affordance", async ({ page }) => {
    // Per b1-mobile/getting-started/logging-in.md, an anonymous visitor to
    // /mobile/* should see a way back to the Sign In flow. The MobileDrawer
    // shows a Login button (linking to /mobile/login) when the user is not
    // authenticated.
    await page.context().clearCookies();
    await page.evaluate(() => {
      try { localStorage.clear(); } catch { /* ignore */ }
      try { sessionStorage.clear(); } catch { /* ignore */ }
    }).catch(() => { /* ignore — page not loaded yet */ });
    await page.goto("/mobile/dashboard");
    await expect(page.locator('a[href*="/mobile/login"]').first()).toBeVisible({
      timeout: 15000,
    });
  });
});
