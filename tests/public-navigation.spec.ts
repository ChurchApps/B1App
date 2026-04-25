import { test, expect } from "@playwright/test";
import { SEED_NAV_LINKS } from "./helpers/fixtures";

// Navigation links are seeded in content/demo.sql:589 with visibility rules
// (everyone / members / groups). Anonymous users see only "everyone" links.

test.describe("Public navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("anonymous user sees 'everyone' nav links", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    await expect(body).toContainText(SEED_NAV_LINKS.HOME.text);
    await expect(body).toContainText(SEED_NAV_LINKS.SERMONS.text);
    await expect(body).toContainText(SEED_NAV_LINKS.GIVE.text);
  });

  test("anonymous user does NOT see 'members' nav link", async ({ page }) => {
    await page.goto("/");
    const memberLinks = page.locator(`a:has-text("${SEED_NAV_LINKS.MEMBERS_AREA.text}")`);
    expect(await memberLinks.count()).toBe(0);
  });

  test("anonymous user does NOT see 'groups' nav link", async ({ page }) => {
    await page.goto("/");
    // Youth link has visibility: groups (group-restricted).
    const youthLinks = page.locator(`a[href="${SEED_NAV_LINKS.YOUTH.url}"]`);
    expect(await youthLinks.count()).toBe(0);
  });

  test("clicking Sermons nav link navigates to /sermons", async ({ page }) => {
    await page.goto("/");
    const sermonsLink = page.locator(`a[href="${SEED_NAV_LINKS.SERMONS.url}"]`).first();
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
});
