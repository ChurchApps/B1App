import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile groups", () => {
  test("groups page loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/groups");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("shows demo user's seeded group memberships", async ({ page }) => {
    await page.goto("/mobile/groups");
    const body = page.locator("body");
    await expect(body).toContainText(/Sunday Morning Service|Adult Bible Class|Men's Bible Study/i, { timeout: 15000 });
  });

  test("legacy /mobile/myGroups slug routes to groups", async ({ page }) => {
    await page.goto("/mobile/myGroups");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("tapping a group card navigates to its detail page", async ({ page }) => {
    await page.goto("/mobile/groups");
    const card = page.locator("main").getByText(/Adult Bible Class/i).first();
    await card.waitFor({ state: "visible", timeout: 15000 });
    await card.click();
    await expect(page).toHaveURL(/\/mobile\/groups\/GRP\d+/, { timeout: 15000 });
  });

  test("group detail page loads About tab and member-visible Messages tab", async ({ page }) => {
    await page.goto("/mobile/groups/GRP00000004");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.getByRole("tab", { name: /About/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("tab", { name: /Messages/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Members/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Events/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Resources/i })).toBeVisible();
  });

  test("group detail About tab shows the group description", async ({ page }) => {
    await page.goto("/mobile/groups/GRP00000004");
    // GroupDetail auto-switches to Plans tab; click About to avoid race.
    await page.getByRole("tab", { name: /^About$/i }).click();
    await expect(page.locator("main")).toContainText(/Bible study for adults/i, { timeout: 15000 });
  });

  test("group detail page resolves a slug as well as an id", async ({ page }) => {
    await page.goto("/mobile/groups/adult-bible-class");
    await expect(page.locator("main")).toContainText(/Adult Bible Class|Bible study for adults/i, { timeout: 15000 });
    await expect(page.getByRole("tab", { name: /About/i })).toBeVisible();
  });

  test("authed non-member sees contact form on About tab", async ({ page }) => {
    await page.goto("/mobile/groups/GRP00000005");
    await expect(page.getByRole("tab", { name: /About/i })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="group-contact-first-name-input"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="group-contact-submit-button"]')).toBeVisible();
  });

  test("authed member does not see contact form on their own group", async ({ page }) => {
    await page.goto("/mobile/groups/GRP00000004");
    await expect(page.getByRole("tab", { name: /About/i })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="group-contact-submit-button"]')).toHaveCount(0);
  });
});

test.describe("Mobile group event registration (leader)", () => {
  const GROUP_ID = "GRP00000023";

  test("leader can toggle registration on a new event and the fields round-trip", async ({ page }) => {
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    await expect(page.getByRole("tab", { name: /Events/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole("tab", { name: /Events/i }).click();

    const addBtn = page.getByRole("button", { name: /^Add Event$/i });
    await addBtn.waitFor({ state: "visible", timeout: 15000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/^New Event$/i)).toBeVisible();

    const titleMarker = `Reg Test ${Date.now()}`;
    await dialog.getByLabel(/^Title$/).fill(titleMarker);

    // MUI <Switch> uses role="switch", not "checkbox".
    await expect(dialog.getByLabel(/^Capacity$/)).toHaveCount(0);
    await dialog.getByRole("switch", { name: /Registration/i }).check();
    await expect(dialog.getByLabel(/^Capacity$/)).toBeVisible();
    await expect(dialog.getByLabel(/^Tags$/)).toBeVisible();
    await expect(dialog.getByLabel(/Registration Opens/i)).toBeVisible();
    await expect(dialog.getByLabel(/Registration Closes/i)).toBeVisible();

    await dialog.getByLabel(/^Capacity$/).fill("42");
    await dialog.getByLabel(/^Tags$/).fill("e2e,test");

    await dialog.getByRole("button", { name: /^Save$/ }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    const eventRow = page.locator("main").getByText(titleMarker).first();
    await eventRow.waitFor({ state: "visible", timeout: 15000 });
    const editBtn = page.getByRole("button", { name: /^Edit event$/i }).first();
    await editBtn.click();

    const editDialog = page.getByRole("dialog");
    await expect(editDialog).toBeVisible({ timeout: 5000 });
    // Locale key renders "Edit event" (lowercase) vs. "New Event"; use case-insensitive match.
    await expect(editDialog.getByText(/^Edit event$/i)).toBeVisible();
    await expect(editDialog.getByRole("switch", { name: /Registration/i })).toBeChecked();
    await expect(editDialog.getByLabel(/^Capacity$/)).toHaveValue("42");
  });
});
