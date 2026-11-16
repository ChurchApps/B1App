import { test, expect } from "@playwright/test";

// Signed-out visitors can find the church's registration-enabled events in the app.
// Demo: EVT00000015 "Vacation Bible School" has registration open (seeded in Api content/demo.sql).
test.describe("Upcoming events when signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 390, height: 844 } });

  test("Home lists registration-enabled events with a Register link", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.getByText("Upcoming events", { exact: true })).toBeVisible({ timeout: 30000 });
    const row = page.getByTestId("dashboard-event-row").filter({ hasText: "Vacation Bible School" });
    await expect(row).toBeVisible();
    await expect(row.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/mobile/register/EVT00000015");
  });

  test("the Register link opens the guest registration form", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    const row = page.getByTestId("dashboard-event-row").filter({ hasText: "Vacation Bible School" });
    const register = row.getByRole("link", { name: "Register" });
    await expect(register).toBeVisible({ timeout: 30000 });
    // Home can re-render while its queries settle; retry the tap until it navigates.
    await expect(async () => {
      await register.click();
      await expect(page).toHaveURL(/\/mobile\/register\/EVT00000015/, { timeout: 5000 });
    }).toPass({ timeout: 30000 });
    await expect(page.locator("main")).toContainText(/Vacation Bible School/i, { timeout: 15000 });
    await expect(page.locator("main").getByRole("button", { name: /Continue/i }).first()).toBeVisible();
  });

  test("Groups tab shows Upcoming Events under the sign-in prompt", async ({ page }) => {
    await page.goto("/mobile/groups");
    await expect(page.getByTestId("groups-sign-in")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Upcoming Events", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.locator("main").getByRole("link", { name: "Register" }).first()).toBeVisible();
    await expect(page.locator('main a[href="/mobile/register/EVT00000015"]')).toBeVisible();
  });
});
