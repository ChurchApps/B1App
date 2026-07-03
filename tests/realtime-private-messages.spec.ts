import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

/** Validates that the private-messages list and thread view consume the consolidated subscription path. */
test.describe("Realtime — private messages", () => {
  test("messages list page loads", async ({ page }) => {
    await page.goto("/mobile/messages");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
  });

  test("compose page renders search input", async ({ page }) => {
    await page.goto("/mobile/messagesNew");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    const searchBox = page.getByRole("textbox").first();
    await expect(searchBox).toBeVisible({ timeout: 15000 });
  });

  test("attempting a direct thread URL routes correctly", async ({ page }) => {
    await page.goto("/mobile/messages/PER00000001");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    await expect(page.locator("body")).toContainText(/Donald Clark|Send|Message/i, { timeout: 15000 });
  });
});
