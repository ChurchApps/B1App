import { test, expect } from "@playwright/test";

// ProfileEditPage has 4 tabs: Profile / Household / Account / Visibility.
// Demo user is "Demo User" (PER00000082).

test.describe("Mobile profile edit", () => {
  test("profile screen renders with all tabs", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: /Profile/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[role="tab"]').filter({ hasText: /Household/i })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: /Account/i })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: /Visibility/i })).toBeVisible();
  });

  test("profile tab shows demo user's first name", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const firstNameInput = page.locator('input').filter({ hasText: "" }).first();
    await firstNameInput.waitFor({ state: "visible", timeout: 10000 });
    // Demo user's first name is "Demo".
    await expect(page.locator("body")).toContainText("Demo", { timeout: 10000 });
  });

  test("can switch to Household tab", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const householdTab = page.locator('[role="tab"]').filter({ hasText: /Household/i });
    await householdTab.waitFor({ state: "visible", timeout: 10000 });
    await householdTab.click();
    await expect(householdTab).toHaveAttribute("aria-selected", "true");
  });
});
