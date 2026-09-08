import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";
import { DEMO_CHURCH } from "./helpers/fixtures";

// /mobile entry point: greeting header, verse of the day, hero card, Explore grid, notifications

test.describe("Mobile shell", () => {
  test("/mobile redirects to /mobile/dashboard", async ({ page }) => {
    await page.goto("/mobile");
    await expect(page).toHaveURL(/\/mobile\/dashboard/);
  });

  test("dashboard shows logged-in chrome (Logout button)", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("unknown mobile slug renders a not-found card with a way home", async ({ page }) => {
    await page.goto("/mobile/this-screen-does-not-exist");
    await expect(page.locator("main")).toContainText(/Page not found/i, { timeout: 15000 });
    await expect(page.locator("main")).not.toContainText(/coming soon|not yet implemented/i);
    await page.locator("main").getByRole("link", { name: /Back to home/i }).click();
    await expect(page).toHaveURL(/\/mobile\/dashboard/, { timeout: 15000 });
  });

  test("drawer footer shows the church name, not a product name", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    const nav = page.getByRole("navigation", { name: /Main navigation/i });
    await expect(nav).toContainText(DEMO_CHURCH.NAME, { timeout: 15000 });
    await expect(nav).not.toContainText(/B1 Mobile Web/i);
  });

  test("app bar titles the Me screen", async ({ page }) => {
    await page.goto("/mobile/me");
    const header = page.locator("header, [role='banner']").first();
    await expect(header.getByText("Me", { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test("app bar shows the church name", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.locator("header, [role='banner']").first()).toContainText(
      DEMO_CHURCH.NAME
    );
  });

  test("app bar exposes notifications bell and profile avatar", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.getByRole("button", { name: /Notifications/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /^Profile$/i })).toBeVisible();
  });

  test("dashboard renders Explore section", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.locator("body")).toContainText(/Explore/i, { timeout: 15000 });
  });

  test("dashboard renders the Verse of the Day card", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.locator("body")).toContainText(/Verse of the Day/i, { timeout: 15000 });
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
