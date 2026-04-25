import { test, expect } from "@playwright/test";

// MessagesPage shows the user's conversations. Seeded conversations exist in
// messaging/demo.sql — including a Youth Group Chat (CVS00000002).

test.describe("Mobile messages", () => {
  test("messages page loads with authenticated header", async ({ page }) => {
    await page.goto("/mobile/messages");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });

  test("compose message screen loads", async ({ page }) => {
    await page.goto("/mobile/messagesNew");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
  });
});
