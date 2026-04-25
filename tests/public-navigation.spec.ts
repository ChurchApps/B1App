import { test, expect } from "@playwright/test";
import { SEED_NAV_LINKS } from "./helpers/fixtures";

// Navigation links are seeded with category='website' so ConfigHelper.load
// returns them via /links/church/{id}?category=website (content/demo.sql:589).
// On md+ viewports they render inline in the header; on small viewports the
// header collapses to a hamburger menu (Header.tsx:271-281).

test.describe("Public navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("anonymous user sees seeded nav links in header", async ({ page }) => {
    await page.goto("/");
    const navbar = page.locator("#navbar");
    await navbar.waitFor({ state: "visible", timeout: 15000 });
    await expect(navbar).toContainText(SEED_NAV_LINKS.HOME.text);
    await expect(navbar).toContainText(SEED_NAV_LINKS.SERMONS.text);
    await expect(navbar).toContainText(SEED_NAV_LINKS.GIVE.text);
  });

  test("clicking Sermons nav link navigates to /sermons", async ({ page }) => {
    await page.goto("/");
    const sermonsLink = page
      .locator(`#navbar a[href="${SEED_NAV_LINKS.SERMONS.url}"]`)
      .first();
    await sermonsLink.waitFor({ state: "visible", timeout: 15000 });
    await sermonsLink.click();
    await expect(page).toHaveURL(/\/sermons/);
  });

  test("login chip links to /login", async ({ page }) => {
    await page.goto("/");
    const loginChip = page.locator('[data-testid="login-chip"]');
    await expect(loginChip).toBeVisible();
    const href = await loginChip.getAttribute("href");
    expect(href).toContain("/login");
  });

  test("mobile viewport shows hamburger menu button", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible({
      timeout: 15000,
    });
  });
});
