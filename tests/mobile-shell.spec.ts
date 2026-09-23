import { test, expect, type Page } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";
import { DEMO_CHURCH, SEED_PEOPLE } from "./helpers/fixtures";

const SAFE_TOP = 62;

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

  // iOS 27 Liquid Glass chrome covers the dashboard header and the drawer
  // profile. The shell must keep those in a content safe zone driven by
  // --safe-top so a non-zero top inset actually moves them.
  test.describe("content safe zone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("dashboard header and drawer profile clear a 62px top safe inset", async ({ page }) => {
      await page.goto("/mobile/dashboard");
      const header = page.locator("main header").first();
      await expect(header).toBeVisible({ timeout: 15000 });
      await expect(header).toContainText(DEMO_CHURCH.NAME);

      await applySafeTop(page);

      const headerBox = await header.boundingBox();
      expect(headerBox, "dashboard header should be laid out").not.toBeNull();
      expect(
        headerBox!.y,
        `dashboard header y=${headerBox!.y} sits inside the ${SAFE_TOP}px top safe zone`
      ).toBeGreaterThanOrEqual(SAFE_TOP - 1);

      await page.getByRole("button", { name: /Open navigation menu/i }).click();
      const drawer = page.locator(".MuiDrawer-paper").filter({ visible: true });
      await expect(drawer.getByRole("button", { name: /Edit Profile/i })).toBeVisible({ timeout: 10000 });

      const profileBox = await drawer.getByText(SEED_PEOPLE.DEMO, { exact: true }).boundingBox();
      expect(profileBox, "drawer profile name should be laid out").not.toBeNull();
      expect(
        profileBox!.y,
        `drawer profile y=${profileBox!.y} sits inside the ${SAFE_TOP}px top safe zone`
      ).toBeGreaterThanOrEqual(SAFE_TOP - 1);
    });
  });
});

// Issue #1119: in dark mode the drawer's theme toggle rendered the raw key
// "mobile.components.lightMode". Light mode hid the bug — "darkMode" already existed.
test.describe("Mobile shell dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("the drawer theme toggle offers a translated switch back to light mode", async ({ page }) => {
    // MobileThemeProvider prefers a stored mode over prefers-color-scheme, so clear it.
    await page.addInitScript(() => { try { window.localStorage.removeItem("b1mobile.theme"); } catch { } });
    await page.goto("/mobile/dashboard");

    const nav = page.getByRole("navigation", { name: /Main navigation/i }).first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const toggle = nav.getByRole("button").filter({ hasText: /Mode|mobile\.components\./i }).first();
    await expect(toggle).toBeVisible({ timeout: 15000 });
    await expect(toggle).toContainText("Light Mode");
    await expect(toggle).toHaveAccessibleName("Switch to light mode");
    await expect(toggle, '"mobile.components.lightMode" must never render as literal text').not.toContainText("mobile.components.");
  });
});

async function applySafeTop(page: Page) {
  await page.addStyleTag({ content: `:root, .mobileAppRoot { --safe-top: ${SAFE_TOP}px !important; --safe-bottom: 34px !important; }` });
}
