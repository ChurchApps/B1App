import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// ProfileEditPage has 4 tabs: Profile / Household / Account / Privacy.

test.describe("Mobile profile edit", () => {
  test("profile screen renders with all tabs", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: /Profile/i }).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('[role="tab"]').filter({ hasText: /Household/i })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: /Account/i })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: /Privacy/i })).toBeVisible();
  });

  test("profile tab shows demo user content", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await expect(mobileLogoutButton(page)).toBeVisible();
    // Demo user's first name is "Demo".
    await expect(page.locator("body")).toContainText("Demo", { timeout: 15000 });
  });

  test("can switch to Household tab", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const householdTab = page.locator('[role="tab"]').filter({ hasText: /Household/i });
    await householdTab.waitFor({ state: "visible", timeout: 15000 });
    await householdTab.click();
    await expect(householdTab).toHaveAttribute("aria-selected", "true");
  });
});
