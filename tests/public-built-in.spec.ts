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
    // Donate page either prompts login (anonymous) or shows the donation form.
    // Either way the page loads (no 404).
    await expect(page).toHaveURL(/\/donate/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("/stream renders streaming page", async ({ page }) => {
    await page.goto("/stream");
    await expect(page).toHaveURL(/\/stream/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("/bible renders bible page", async ({ page }) => {
    await page.goto("/bible");
    await expect(page).toHaveURL(/\/bible/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("/votd renders verse-of-the-day page", async ({ page }) => {
    await page.goto("/votd");
    await expect(page).toHaveURL(/\/votd/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("/this-page-does-not-exist returns 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    // Next.js notFound() returns a 404 status.
    expect(response?.status()).toBe(404);
  });
});
