import { test, expect } from "@playwright/test";

// Issue #1013: large-screen left nav has no Home; bottom tabs do.

test("left navigation includes Home on large screens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/mobile/dashboard");
  const nav = page.getByRole("navigation", { name: /Main navigation/i });
  await expect(nav).toBeVisible({ timeout: 15000 });
  await expect(nav.getByRole("link", { name: /^Home$/i })).toBeVisible();
});
