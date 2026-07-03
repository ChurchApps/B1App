import { test, expect } from "@playwright/test";

// Public Groups Browser at /groups (GET /membership/groups/public/:churchId/list)

test.describe("Public groups browser", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/groups renders heading and at least one group card", async ({ page }) => {
    await page.goto("/groups");
    await expect(page.locator('[data-testid="groups-browser"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Find a Group/i })).toBeVisible();
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
    await expect.poll(async () => page.locator('[data-testid^="group-card-"]').count(), { timeout: 5000 }).toBeLessThan(initialCount);
    await expect(page.locator("body")).toContainText(/Adult Bible Class/i);
  });

  test("category filter narrows by category", async ({ page }) => {
    await page.goto("/groups");
    // MUI Select: click visible combobox via role, not hidden input data-testid.
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

  test("/ministries CMS page renders the groups element with real groups", async ({ page }) => {
    await page.goto("/ministries");
    await expect(page.locator('[data-testid="groups-browser"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Find a Group/i })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Sunday Morning Service|Adult Bible Class/i);
  });
});
