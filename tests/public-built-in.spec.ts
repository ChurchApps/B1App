import { test, expect } from "@playwright/test";

// Built-in public routes handled in [pageSlug]/page.tsx (votd / bible / donate /
// stream / sermons). These render dedicated component wrappers regardless of
// whether a custom page exists for the slug.

test.describe("Public built-in routes", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("/donate renders donation page", async ({ page }) => {
    await page.goto("/donate");
    await expect(page).toHaveURL(/\/donate/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("/donate references seeded fund (General Fund)", async ({ page }) => {
    await page.goto("/donate");
    // Either the fund picker shows General Fund, or the page prompts login
    // (with a returnUrl pointing back to /donate). Either way the URL stays
    // on /donate.
    const body = page.locator("body");
    await body.waitFor({ state: "visible", timeout: 15000 });
    const text = (await body.textContent()) || "";
    expect(/General Fund|login|Sign In/i.test(text)).toBe(true);
  });

  test("/stream renders streaming page", async ({ page }) => {
    await page.goto("/stream");
    await expect(page).toHaveURL(/\/stream/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("/bible renders bible page with Genesis-1:1 iframe", async ({ page }) => {
    await page.goto("/bible");
    await expect(page).toHaveURL(/\/bible/);
    await expect(page.locator("h1").filter({ hasText: /^Bible$/ })).toBeVisible({ timeout: 15000 });
    // BiblePage embeds a biblia.com iframe with default reference Ge1.1.
    const iframe = page.locator('iframe[title="content"]');
    await expect(iframe).toHaveAttribute("src", /Ge1\.1/, { timeout: 15000 });
  });

  test("/votd renders verse-of-the-day page", async ({ page }) => {
    await page.goto("/votd");
    await expect(page).toHaveURL(/\/votd/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("/this-page-does-not-exist returns 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
