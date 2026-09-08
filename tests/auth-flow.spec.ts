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
    await expect(page.locator('a[href*="/mobile/login"]').first()).toBeVisible({ timeout: 15000 });
  });

  test("anonymous member-portal route returns to the mobile login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/mobile/donate/print");
    await page.waitForURL(/\/mobile\/login\?returnUrl=%2Fmobile%2Fdonate%2Fprint/, { timeout: 30000 });
  });
});

// On a phone-sized viewport the "Don't have an account? Register" link at the
// bottom of the login card used to sit underneath the fixed #login-footer bar.
// Even after scrolling to the bottom of the page the link stayed covered, so it
// could not be tapped.
test.describe("Mobile login register link", () => {
  test.use({
    viewport: { width: 390, height: 664 },
    storageState: { cookies: [], origins: [] }
  });

  test("register link clears the fixed footer once the page is scrolled down", async ({ page }) => {
    await page.goto("/login");

    const register = page.locator("#register-link");
    await expect(register).toBeVisible();
    await expect(page.locator("#login-footer")).toBeVisible();

    // A phone user scrolls to the bottom of the sign-in page to reach the link.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight));

    const probe = await register.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) as HTMLElement | null;
      const footer = document.getElementById("login-footer");
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      return {
        linkTop: rect.top,
        linkBottom: rect.bottom,
        footerTop: footerRect ? footerRect.top : null,
        viewportHeight: window.innerHeight,
        hitId: hit ? (hit.id || hit.tagName) : null,
        covered: !(hit === el || el.contains(hit))
      };
    });

    expect(probe.footerTop, "login footer should be rendered").not.toBeNull();

    // The whole link has to be on screen...
    expect(probe.linkTop, "register link is scrolled off the top of the viewport").toBeGreaterThanOrEqual(0);
    expect(probe.linkBottom, "register link is below the bottom of the viewport").toBeLessThanOrEqual(probe.viewportHeight);

    // ...and clear of the fixed footer bar.
    expect(
      probe.linkBottom,
      `register link (bottom ${probe.linkBottom}) overlaps the fixed footer (top ${probe.footerTop})`
    ).toBeLessThanOrEqual(probe.footerTop as number);

    // A tap in the middle of the link must actually reach the link.
    expect(probe.covered, `register link is covered by "${probe.hitId}"`).toBe(false);
  });
});
