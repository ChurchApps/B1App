import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile profile edit", () => {
  // The old Profile/Household/Account/Privacy tabs are sections of one plate; each edits in a sheet.
  test("profile screen renders every section", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await expect(mobileLogoutButton(page)).toBeVisible();
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Photo & name", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(main.getByRole("heading", { name: "Contact", exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Household", exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Privacy", exact: true })).toBeVisible();
  });

  test("profile section shows demo user content", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("body")).toContainText("Demo", { timeout: 15000 });
  });

  test("Household section opens the add-family-member sheet", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const add = page.getByTestId("profile-edit-household");
    await add.waitFor({ state: "visible", timeout: 15000 });
    await add.click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toContainText(/Add Family Member/i);
    await expect(sheet.getByRole("textbox", { name: /First Name/i })).toBeVisible();
    await sheet.getByRole("button", { name: /^Cancel$/i }).click();
    await expect(sheet).toBeHidden({ timeout: 5000 });
  });

  test("Privacy section exposes visibility controls", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const main = page.locator("main");
    await expect(main).toContainText(/Address Visibility/i, { timeout: 15000 });
    await page.getByTestId("profile-edit-privacy").click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toContainText(/Visibility Preferences/i, { timeout: 15000 });
    await expect(sheet).toContainText(/Address Visibility/i);
    await expect(sheet).toContainText(/Phone Visibility/i);
    await expect(sheet).toContainText(/Email Visibility/i);
  });

  test("Account section shows the sign-in email", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await expect(page.locator("main")).toContainText(/demo@b1\.church/i, { timeout: 15000 });
    await page.getByTestId("profile-edit-account").click();
    await expect(page.getByRole("dialog")).toContainText(/Change Email/i);
  });

  test("Photo & name sheet pre-fills First Name with demo user's name", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    const edit = page.getByTestId("profile-edit-name");
    await edit.waitFor({ state: "visible", timeout: 15000 });
    await edit.click();
    const firstNameInput = page.getByRole("dialog").getByRole("textbox", { name: /First Name/i }).first();
    await expect(firstNameInput).toBeVisible({ timeout: 15000 });
    await expect(firstNameInput).toHaveValue("Demo");
  });

  test("Household section lists family members from seed", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
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
    const change = page.getByTestId("profile-edit-privacy");
    await change.waitFor({ state: "visible", timeout: 15000 });
    await change.click();
    await page.getByLabel("Email Visibility", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
  }

  async function chooseLevel(page: import("@playwright/test").Page, label: string, option: string) {
    await page.getByLabel(label, { exact: true }).click();
    await page.getByRole("option", { name: option, exact: true }).click();
    await page.locator('[role="listbox"]').waitFor({ state: "hidden", timeout: 5000 });
  }

  async function savePrivacy(page: import("@playwright/test").Page) {
    const saved = page.waitForResponse((r) => r.url().includes("/visibilityPreferences") && r.request().method() === "POST" && r.status() === 200, { timeout: 15000 });
    await page.getByRole("dialog").getByRole("button", { name: /^Save$/ }).click();
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
    const sheet = page.getByRole("dialog");
    await expect(sheet).toContainText(/Visible only to church staff and the leaders of groups you belong to/i);
    await expect(sheet).toContainText(/Visible only to church staff/i);
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
