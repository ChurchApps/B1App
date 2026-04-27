import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// ProfileEditPage has 4 tabs (per ProfileEditPage.tsx:35):
// Profile / Household / Account / Privacy ("visibility" tab key).

test.describe("Mobile profile edit", () => {
  test("profile screen renders with all four tabs", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Profile$/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("tab", { name: /^Household$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Account$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Privacy$/i })).toBeVisible();
  });

  test("profile tab shows demo user content", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("body")).toContainText("Demo", { timeout: 15000 });
  });

  test("can switch to Household tab", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const householdTab = page.getByRole("tab", { name: /^Household$/i });
    await householdTab.waitFor({ state: "visible", timeout: 15000 });
    await householdTab.click();
    await expect(householdTab).toHaveAttribute("aria-selected", "true");
  });

  test("Privacy tab exposes visibility controls", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const privacyTab = page.getByRole("tab", { name: /^Privacy$/i });
    await privacyTab.waitFor({ state: "visible", timeout: 15000 });
    await privacyTab.click();
    await expect(privacyTab).toHaveAttribute("aria-selected", "true");
    // VisibilityPreferences renders Address / Phone / Email visibility selects.
    const main = page.locator("main");
    await expect(main).toContainText(/Visibility Preferences/i, { timeout: 15000 });
    await expect(main).toContainText(/Address Visibility/i);
    await expect(main).toContainText(/Phone Visibility/i);
    await expect(main).toContainText(/Email Visibility/i);
  });

  test("Account tab shows email field", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const accountTab = page.getByRole("tab", { name: /^Account$/i });
    await accountTab.waitFor({ state: "visible", timeout: 15000 });
    await accountTab.click();
    await expect(accountTab).toHaveAttribute("aria-selected", "true");
    // Demo user email should appear somewhere on the Account tab.
    await expect(page.locator("body")).toContainText(/demo@b1\.church/i, { timeout: 15000 });
  });

  test("Profile tab pre-fills First Name with demo user's name", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    // The default tab is Profile; field key is name.first → label "First Name".
    const firstNameInput = page.getByRole("textbox", { name: /First Name/i }).first();
    await expect(firstNameInput).toBeVisible({ timeout: 15000 });
    await expect(firstNameInput).toHaveValue("Demo");
  });

  test("Household tab lists family members from seed", async ({ page }) => {
    // Demo user's household HOU00000026 contains Jane User (spouse), Alex
    // User (child), and Emma User (child). Per b1-mobile/profile/household.md
    // the Household tab lists family members.
    await page.goto("/mobile/profileEdit");
    const householdTab = page.getByRole("tab", { name: /^Household$/i });
    await householdTab.waitFor({ state: "visible", timeout: 15000 });
    await householdTab.click();
    const main = page.locator("main");
    await expect(main).toContainText(/Jane/, { timeout: 30000 });
    await expect(main).toContainText(/Alex|Emma/);
  });
});
