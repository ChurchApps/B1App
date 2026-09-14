import { test, expect, type Page } from "@playwright/test";
import { DEMO_CHURCH, SEED_PEOPLE } from "./helpers/fixtures";

// Issue #1071: iOS 27 Liquid Glass chrome covers the dashboard header and the
// drawer profile. The mobile shell must keep those in a content safe zone
// driven by --safe-top so a non-zero top inset actually moves them.

const SAFE_TOP = 62;

test.describe("Issue 1071 - mobile content safe zone", () => {
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

async function applySafeTop(page: Page) {
  await page.addStyleTag({ content: `:root, .mobileAppRoot { --safe-top: ${SAFE_TOP}px !important; --safe-bottom: 34px !important; }` });
}
