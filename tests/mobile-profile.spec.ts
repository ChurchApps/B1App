import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

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
    await expect(page.locator("body")).toContainText(/demo@b1\.church/i, { timeout: 15000 });
  });

  test("Profile tab pre-fills First Name with demo user's name", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const firstNameInput = page.getByRole("textbox", { name: /First Name/i }).first();
    await expect(firstNameInput).toBeVisible({ timeout: 15000 });
    await expect(firstNameInput).toHaveValue("Demo");
  });

  test("Household tab lists family members from seed", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const householdTab = page.getByRole("tab", { name: /^Household$/i });
    await householdTab.waitFor({ state: "visible", timeout: 15000 });
    await householdTab.click();
    const main = page.locator("main");
    await expect(main).toContainText(/Jane/, { timeout: 30000 });
    await expect(main).toContainText(/Alex|Emma/);
  });
});

// ChurchAppsSupport#1058: members can pick two stricter levels for their own contact info,
// "My Group Leaders and Staff" and "Staff Only", below "My Groups Only".
test.describe("Mobile profile privacy levels", () => {
  const VISIBILITY_FIELDS = ["Address Visibility", "Phone Visibility", "Email Visibility"];

  async function openPrivacyTab(page: import("@playwright/test").Page) {
    await page.goto("/mobile/profileEdit");
    const privacyTab = page.getByRole("tab", { name: /^Privacy$/i });
    await privacyTab.waitFor({ state: "visible", timeout: 15000 });
    await privacyTab.click();
    await page.getByLabel("Email Visibility", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
  }

  async function chooseLevel(page: import("@playwright/test").Page, label: string, option: string) {
    await page.getByLabel(label, { exact: true }).click();
    await page.getByRole("option", { name: option, exact: true }).click();
    await page.locator('[role="listbox"]').waitFor({ state: "hidden", timeout: 5000 });
  }

  async function savePrivacy(page: import("@playwright/test").Page) {
    const saved = page.waitForResponse((r) => r.url().includes("/visibilityPreferences") && r.request().method() === "POST" && r.status() === 200, { timeout: 15000 });
    await page.getByRole("button", { name: /^Save$/ }).click();
    await saved;
  }

  test("visibility dropdowns offer My Group Leaders and Staff and Staff Only", async ({ page }) => {
    await openPrivacyTab(page);
    for (const label of VISIBILITY_FIELDS) {
      await page.getByLabel(label, { exact: true }).click();
      const listbox = page.locator('[role="listbox"]');
      await expect(listbox.getByRole("option", { name: "My Groups Only", exact: true })).toBeVisible({ timeout: 10000 });
      await expect(listbox.getByRole("option", { name: "My Group Leaders and Staff", exact: true })).toBeVisible();
      await expect(listbox.getByRole("option", { name: "Staff Only", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await listbox.waitFor({ state: "hidden", timeout: 5000 });
    }
    const main = page.locator("main");
    await expect(main).toContainText(/Visible only to church staff and the leaders of groups you belong to/i);
    await expect(main).toContainText(/Visible only to church staff/i);
  });

  test("choosing Staff Only for email saves and survives a reload", async ({ page }) => {
    await openPrivacyTab(page);
    // Start from the seed default even if an earlier run left a saved level behind.
    if ((await page.getByLabel("Email Visibility", { exact: true }).textContent())?.trim() !== "Members Only") {
      await chooseLevel(page, "Email Visibility", "Members Only");
      await savePrivacy(page);
      await openPrivacyTab(page);
    }
    await chooseLevel(page, "Email Visibility", "Staff Only");
    await savePrivacy(page);
    await openPrivacyTab(page);
    await expect(page.getByLabel("Email Visibility", { exact: true })).toHaveText("Staff Only", { timeout: 15000 });

    // Restore the seed default so directory specs keep seeing the demo user's email.
    await chooseLevel(page, "Email Visibility", "Members Only");
    await savePrivacy(page);
    await openPrivacyTab(page);
    await expect(page.getByLabel("Email Visibility", { exact: true })).toHaveText("Members Only", { timeout: 15000 });
  });
});
