import { test, expect } from "@playwright/test";

// Tests for the new public Groups Browser at /groups (anonymous, no login).
// Backed by GET /membership/groups/public/:churchId/list — returns every
// non-removed group for the church. Demo seed includes ~30 groups across
// categories: Worship, Music, Small Groups, Sunday School, etc.

test.describe("Public groups browser", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/groups renders heading and at least one group card", async ({ page }) => {
    await page.goto("/groups");
    await expect(page.locator('[data-testid="groups-browser"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Find a Group/i })).toBeVisible();
    // Cards link to /groups/details/{slug}; pick a stable seeded group.
    await expect(page.locator('[data-testid^="group-card-"]')).not.toHaveCount(0);
    await expect(page.locator("body")).toContainText(/Sunday Morning Service|Adult Bible Class/i);
  });

  test("search input narrows the visible cards", async ({ page }) => {
    await page.goto("/groups");
    const search = page.locator('[data-testid="groups-browser-search"]');
    await expect(search).toBeVisible({ timeout: 15000 });

    const initialCount = await page.locator('[data-testid^="group-card-"]').count();
    expect(initialCount).toBeGreaterThan(1);

    await search.fill("Adult Bible");
    // Wait for filter to take effect — count drops to a small set including Adult Bible Class.
    await expect.poll(async () => page.locator('[data-testid^="group-card-"]').count(), { timeout: 5000 }).toBeLessThan(initialCount);
    await expect(page.locator("body")).toContainText(/Adult Bible Class/i);
  });

  test("category filter narrows by category", async ({ page }) => {
    await page.goto("/groups");
    // The MUI Select's visible combobox is the role-named element; the
    // data-testid we pass to inputProps lands on the hidden native input,
    // so we click the combobox by its accessible name instead.
    // MUI's <InputLabel> wires accessible-name via labeling but the browser
    // doesn't always promote it through an aria-labelledby chain Playwright
    // accepts. Click the visible combobox via its displayed value role.
    await expect(page.locator('[data-testid="groups-browser"] [role="combobox"]')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="groups-browser"] [role="combobox"]').click();

    const worshipOption = page.locator('li[role="option"]').filter({ hasText: /^Worship$/i }).first();
    await worshipOption.click();

    await expect(page.locator("body")).toContainText(/Sunday Morning Service/i);
    await expect(page.locator("body")).not.toContainText(/Adult Bible Class/i);
  });

  test("nonsense search shows the empty state", async ({ page }) => {
    await page.goto("/groups");
    const search = page.locator('[data-testid="groups-browser-search"]');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill("zzzzzzzznoMatchAtAll");
    await expect(page.locator('[data-testid="groups-browser-empty"]')).toBeVisible({ timeout: 5000 });
  });
});
