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

  test("compose page renders search-for-a-person prompt", async ({ page }) => {
    await page.goto("/mobile/messagesNew");
    await expect(page.locator("main")).toContainText(/Search for a person/i, { timeout: 30000 });
  });

  test("compose page search input accepts a name", async ({ page }) => {
    await page.goto("/mobile/messagesNew");
    const searchBox = page.getByRole("textbox").first();
    await searchBox.waitFor({ state: "visible", timeout: 15000 });
    await searchBox.fill("Donald");
    // Doesn't submit (would mutate); just verifies the input accepts input.
    await expect(searchBox).toHaveValue("Donald");
  });
});
