import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile messages", () => {
  test("messages page loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/messages");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("compose message screen loads", async ({ page }) => {
    await page.goto("/mobile/messagesNew");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });
});
