import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";
import { getApi, apiCall, membershipUrl, type ApiHandle } from "./helpers/api";
import { DEMO_CHURCH } from "./helpers/fixtures";

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

// ChurchAppsSupport#1448: members set their own title, and Add Family Member asks last name, title,
// mobile phone and household role. The demo church has no Directory Approval Group, so both save directly.
test.describe.serial("Mobile profile title and family member details", () => {
  const FAMILY_FIRST = "Zimrifamily";
  let api: ApiHandle;
  let demoPersonId = "";

  const findFamily = async () => ((await (await apiCall(api, "get", membershipUrl("/people/search?term=" + FAMILY_FIRST))).json()) as any[]) || [];

  test.beforeAll(async () => {
    api = await getApi("demo", "MembershipApi");
    for (const p of await findFamily()) await apiCall(api, "delete", membershipUrl("/people/" + p.id));
  });

  test.afterAll(async () => {
    for (const p of await findFamily()) await apiCall(api, "delete", membershipUrl("/people/" + p.id));
    if (demoPersonId) {
      const me = await (await apiCall(api, "get", membershipUrl("/people/" + demoPersonId))).json();
      await apiCall(api, "post", membershipUrl("/people"), [{ ...me, name: { ...me.name, prefix: "" } }]);
    }
    await api.request.dispose();
  });

  test("Photo & name sheet saves a title", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await page.getByTestId("profile-edit-name").click({ timeout: 30000 });
    const title = page.getByTestId("profile-title");
    await expect(title).toBeVisible({ timeout: 15000 });
    await title.fill("Dr");
    const saved = page.waitForRequest((r) => r.method() === "POST" && /\/membership\/people$/.test(r.url()), { timeout: 30000 });
    await page.getByRole("button", { name: "Save Changes" }).click();
    demoPersonId = (await saved).postDataJSON()[0].id;
    await expect(page.getByText("Your changes have been saved.")).toBeVisible({ timeout: 15000 });
    const me = await (await apiCall(api, "get", membershipUrl("/people/" + demoPersonId))).json();
    expect(me.name.prefix).toBe("Dr");
  });

  test("Add Family Member saves last name, title, phone and household role", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await page.getByTestId("profile-edit-household").click({ timeout: 30000 });
    const sheet = page.getByRole("dialog");
    await sheet.getByTestId("family-member-first").fill(FAMILY_FIRST);
    await sheet.getByTestId("family-member-last").fill("Userson");
    await sheet.getByTestId("family-member-title").fill("Mr");
    await sheet.getByTestId("family-member-phone").fill("555-401-1448");
    await sheet.getByTestId("family-member-role").click();
    await page.getByRole("option", { name: "Child", exact: true }).click();
    await sheet.getByTestId("family-member-add").click();
    await expect(sheet).toContainText(`Mr ${FAMILY_FIRST} Userson`);

    const created = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/people/familyMember"), { timeout: 30000 });
    await sheet.getByRole("button", { name: "Save Changes" }).click();
    expect((await created).ok()).toBeTruthy();
    await expect(page.getByText("Your changes have been saved.")).toBeVisible({ timeout: 15000 });

    const [member] = await findFamily();
    expect(member).toBeTruthy();
    const full = await (await apiCall(api, "get", membershipUrl("/people/" + member.id))).json();
    expect(full.name).toMatchObject({ first: FAMILY_FIRST, last: "Userson", prefix: "Mr" });
    expect(full.householdRole).toBe("Child");
    expect(full.contactInfo.mobilePhone).toContain("555");
  });
});

// ChurchAppsSupport#1481: the Title suggestions come from the church's own title list.
test.describe.serial("Mobile profile church title list", () => {
  let api: ApiHandle;
  let original: any = null;

  test.beforeAll(async () => {
    api = await getApi("demo", "MembershipApi");
    const all = (await (await apiCall(api, "get", membershipUrl("/settings"))).json()) as any[];
    const existing = all.find((s) => s.keyName === "titleOptions");
    original = existing ? { ...existing } : null;
    const res = await apiCall(api, "post", membershipUrl("/settings"), [{ ...(existing || { churchId: DEMO_CHURCH.ID, keyName: "titleOptions", public: 1 }), value: JSON.stringify(["Deacon", "Elder"]) }]);
    expect(res.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    const all = (await (await apiCall(api, "get", membershipUrl("/settings"))).json()) as any[];
    const current = all.find((s) => s.keyName === "titleOptions");
    if (current) await apiCall(api, "post", membershipUrl("/settings"), [{ ...current, value: original?.value ?? "[]" }]);
    await api.request.dispose();
  });

  test("Photo & name sheet suggests the church's titles", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await page.getByTestId("profile-edit-name").click({ timeout: 30000 });
    const title = page.getByTestId("profile-title");
    await expect(title).toBeVisible({ timeout: 15000 });
    await title.click();
    await expect(page.getByRole("option", { name: "Deacon", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("option", { name: "Elder", exact: true })).toBeVisible();
    await expect(page.getByRole("option", { name: "Pastor", exact: true })).toHaveCount(0);
  });
});
