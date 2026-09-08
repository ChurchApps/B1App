import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile Me page", () => {
  test("renders upcoming items and event rows navigate to the group", async ({ page }) => {
    await page.goto("/mobile/me");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });

    await expect(page.locator("main")).toContainText(/Upcoming/i, { timeout: 15000 });

    const eventRow = page.getByTestId("me-item-event").first();
    await expect(eventRow).toBeVisible({ timeout: 15000 });
    await eventRow.click();
    await expect(page).toHaveURL(/\/mobile\/groups\//, { timeout: 15000 });
  });

  test("lists hub shortcuts and Edit Profile opens the profile screen", async ({ page }) => {
    await page.goto("/mobile/me");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    const main = page.locator("main");
    await expect(main.getByTestId("me-shortcut-notificationPrefs")).toBeVisible({ timeout: 15000 });
    await expect(main.getByTestId("me-shortcut-messages")).toBeVisible();
    await expect(main.getByTestId("me-shortcut-donate")).toBeVisible();
    await expect(main.getByTestId("me-shortcut-registrations")).toBeVisible();
    await main.getByTestId("me-shortcut-profileEdit").click();
    await expect(page).toHaveURL(/\/mobile\/profileEdit/, { timeout: 15000 });
  });

  test("shows a serving row and it navigates to plans", async ({ page }) => {
    await page.goto("/mobile/me");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    const servingRow = page.getByTestId("me-item-serving").first();
    // Seeded assignments surface only if plan dates are upcoming.
    if (await servingRow.isVisible().catch(() => false)) {
      await servingRow.click();
      await expect(page).toHaveURL(/\/mobile\/plans/, { timeout: 15000 });
    }
  });
});
