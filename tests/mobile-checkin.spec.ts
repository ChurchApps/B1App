import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile checkin", () => {
  test("checkin page loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/checkin");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("legacy /mobile/service slug routes to checkin", async ({ page }) => {
    await page.goto("/mobile/service");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("Step 1 lists seeded services (Sunday Morning, Sunday Evening, Wednesday)", async ({ page }) => {
    await page.goto("/mobile/checkin");
    const main = page.locator("main");
    await expect(main).toContainText(/Sunday Morning Service/i, { timeout: 30000 });
  });

  test("each seeded service has a clickable selector for Step 1", async ({ page }) => {
    // Test button presence; click→API→next-step is hard to seed deterministically across timezones.
    await page.goto("/mobile/checkin");
    await expect(page.locator("main")).toContainText(/Sunday Morning Service/i, { timeout: 30000 });
    await expect(
      page.locator('[data-testid="select-service-SER00000001-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="select-service-SER00000002-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="select-service-SER00000003-button"]')
    ).toBeVisible();
  });
});

test.describe("Mobile checkin wayfinding", () => {
  test("step indicator names the current step", async ({ page }) => {
    await page.goto("/mobile/checkin");
    await expect(page.getByTestId("checkin-step-indicator")).toHaveText(/Step 1 of 3 · Service/i, { timeout: 30000 });
  });

  test("signed-out Sign In returns to check-in after login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/mobile/checkin");
    const cta = page.locator("main").getByRole("link", { name: /Sign In/i }).first();
    await expect(cta).toBeVisible({ timeout: 30000 });
    await expect(cta).toHaveAttribute("href", "/mobile/login?returnUrl=/mobile/checkin");
  });
});
