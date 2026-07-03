import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile donate", () => {
  test("donate page loads for authenticated user", async ({ page }) => {
    await page.goto("/mobile/donate");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page).toHaveURL(/\/mobile\/donate/);
  });

  test("legacy /mobile/donation slug routes to donate", async ({ page }) => {
    await page.goto("/mobile/donation");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("authenticated user sees all four giving tabs", async ({ page }) => {
    await page.goto("/mobile/donate");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.getByRole("tab", { name: /Overview/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("tab", { name: /^Donate$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Manage/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /History/i })).toBeVisible();
  });

  test("can switch between tabs without crashing", async ({ page }) => {
    await page.goto("/mobile/donate");
    const donateTab = page.getByRole("tab", { name: /^Donate$/i });
    await donateTab.waitFor({ state: "visible", timeout: 15000 });
    await donateTab.click();
    await expect(donateTab).toHaveAttribute("aria-selected", "true");
    const historyTab = page.getByRole("tab", { name: /History/i });
    await historyTab.click();
    await expect(historyTab).toHaveAttribute("aria-selected", "true");
  });

  test("History tab shows seeded demo-user donations", async ({ page }) => {
    await page.goto("/mobile/donate");
    const historyTab = page.getByRole("tab", { name: /History/i });
    await historyTab.waitFor({ state: "visible", timeout: 15000 });
    await historyTab.click();
    await expect(page.locator("main")).toContainText(/General Fund/i, { timeout: 15000 });
  });

  test("Overview tab shows year-to-date total and a Repeat affordance", async ({ page }) => {
    await page.goto("/mobile/donate");
    const overviewTab = page.getByRole("tab", { name: /Overview/i });
    await overviewTab.waitFor({ state: "visible", timeout: 15000 });
    await overviewTab.click();
    const main = page.locator("main");
    await expect(main).toContainText(/Total this year/i, { timeout: 30000 });
    await expect(main.getByRole("button", { name: /Repeat/i })).toBeVisible();
  });
});
