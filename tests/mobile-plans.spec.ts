import { test, expect } from "@playwright/test";

// PlansPage shows the user's volunteer plan assignments via tabs (upcoming /
// past). Demo user's plan assignments live in doing/demo.sql.

test.describe("Mobile plans", () => {
  test("plans page renders with tabs", async ({ page }) => {
    await page.goto("/mobile/plans");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
    // Tabs are MUI <Tab> elements with role="tab".
    const tabs = page.locator('[role="tab"]');
    await tabs.first().waitFor({ state: "visible", timeout: 10000 });
    await expect(page.locator('[role="tab"]').filter({ hasText: /Upcoming/i })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: /Past/i })).toBeVisible();
  });

  test("can switch between Upcoming and Past tabs", async ({ page }) => {
    await page.goto("/mobile/plans");
    const pastTab = page.locator('[role="tab"]').filter({ hasText: /Past/i });
    await pastTab.waitFor({ state: "visible", timeout: 10000 });
    await pastTab.click();
    await expect(pastTab).toHaveAttribute("aria-selected", "true");
  });
});
