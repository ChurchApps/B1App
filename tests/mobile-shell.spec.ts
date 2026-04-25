import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";
import { DEMO_CHURCH } from "./helpers/fixtures";

// /mobile is the entry point — redirects to /mobile/dashboard.
// Per b1-mobile/dashboard/index.md the dashboard has a hero card, featured
// section, Quick Actions grid, plus an app bar with bell icon.

test.describe("Mobile shell", () => {
  test("/mobile redirects to /mobile/dashboard", async ({ page }) => {
    await page.goto("/mobile");
    await expect(page).toHaveURL(/\/mobile\/dashboard/);
  });

  test("dashboard shows logged-in chrome (Logout button)", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("unknown mobile slug renders placeholder, not 404", async ({ page }) => {
    await page.goto("/mobile/this-screen-does-not-exist");
    await expect(page.locator("body")).toContainText(/not yet implemented/i);
  });

  test("app bar shows the church name", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.locator("header, [role='banner']").first()).toContainText(
      DEMO_CHURCH.NAME
    );
  });

  test("app bar exposes notifications bell and profile avatar", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.getByRole("button", { name: /Notifications/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: /^Profile$/i })).toBeVisible();
  });

  test("dashboard renders Quick Actions section", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.locator("body")).toContainText(/Quick Actions/i, { timeout: 15000 });
  });

  test("dashboard renders Featured section", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.locator("body")).toContainText(/Featured/i, { timeout: 15000 });
  });

  test("permanent drawer lists primary navigation items", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    const nav = page.getByRole("navigation", { name: /Main navigation/i });
    await expect(nav).toBeVisible({ timeout: 15000 });
    await expect(nav.getByRole("link", { name: /Bible/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Sermons/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Live/i })).toBeVisible();
  });

  test("clicking profile avatar navigates to profile edit", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await page.getByRole("button", { name: /^Profile$/i }).click();
    await expect(page).toHaveURL(/\/mobile\/profileEdit/, { timeout: 15000 });
  });
});
