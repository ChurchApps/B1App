import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile messages", () => {
  test("messages page loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/messages");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("deleting a conversation asks for confirmation first", async ({ page }) => {
    await page.goto("/mobile/messages");
    const deleteBtn = page.locator('[data-testid^="conversation-delete-"]').first();
    await expect(deleteBtn).toBeVisible({ timeout: 30000 });
    await deleteBtn.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText(/Delete conversation/i);
    await dialog.getByRole("button", { name: /^Cancel$/i }).click();
    await expect(dialog).toBeHidden({ timeout: 5000 });
    await expect(deleteBtn).toBeVisible();
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

  test("compose search filters out people under the messaging minimum age", async ({ page }) => {
    // Noah Davis (b. 2020) is under the default-18 minimum; search must not offer him.
    await page.goto("/mobile/messagesNew");
    const searchBox = page.getByRole("textbox").first();
    await searchBox.waitFor({ state: "visible", timeout: 15000 });
    await searchBox.fill("Noah");
    await searchBox.press("Enter");
    await expect(page.locator("main")).toContainText(/No matches found/i, { timeout: 30000 });
  });

  test("compose search still offers adults", async ({ page }) => {
    await page.goto("/mobile/messagesNew");
    const searchBox = page.getByRole("textbox").first();
    await searchBox.waitFor({ state: "visible", timeout: 15000 });
    await searchBox.fill("Donald");
    await searchBox.press("Enter");
    await expect(page.locator("main")).toContainText(/Donald/, { timeout: 30000 });
  });
});
