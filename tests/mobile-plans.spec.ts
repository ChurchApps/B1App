import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile plans", () => {
  test("plans page renders with tabs", async ({ page }) => {
    await page.goto("/mobile/plans");
    await expect(mobileLogoutButton(page)).toBeVisible();
    const tabs = page.locator('[role="tab"]');
    await tabs.first().waitFor({ state: "visible", timeout: 15000 });
    await expect(page.locator('[role="tab"]').filter({ hasText: /Upcoming/i })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: /Past/i })).toBeVisible();
  });

  test("can switch between Upcoming and Past tabs", async ({ page }) => {
    await page.goto("/mobile/plans");
    const pastTab = page.locator('[role="tab"]').filter({ hasText: /Past/i });
    await pastTab.waitFor({ state: "visible", timeout: 15000 });
    await pastTab.click();
    await expect(pastTab).toHaveAttribute("aria-selected", "true");
  });

  test("Upcoming tab lists demo user's seeded Sound Tech assignment", async ({ page }) => {
    // Demo user (PER00000082) has assignment ASS00000008 for POS00000008
    // (Sound Tech) on plan PLA00000001 (Upcoming Worship Schedule), seeded
    // in doing/demo.sql:121.
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Sound Tech|Upcoming Worship Schedule/i, { timeout: 30000 });
  });
});
