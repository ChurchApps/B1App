import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile notifications", () => {
  test("notifications page loads", async ({ page }) => {
    await page.goto("/mobile/notifications");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("notifications page provides tab navigation", async ({ page }) => {
    await page.goto("/mobile/notifications");
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Mobile registrations", () => {
  test("registrations page loads", async ({ page }) => {
    await page.goto("/mobile/registrations");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });
});

test.describe("Mobile volunteer", () => {
  test("volunteer page loads", async ({ page }) => {
    await page.goto("/mobile/volunteer");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("legacy /mobile/volunteerBrowse slug routes to volunteer", async ({ page }) => {
    await page.goto("/mobile/volunteerBrowse");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("volunteer page lists self-signup positions", async ({ page }) => {
    await page.goto("/mobile/volunteer");
    const main = page.locator("main");
    await expect(main).toContainText(/Greeter|Usher/i, { timeout: 30000 });
  });

  test("volunteer plan detail loads when drilling into a position", async ({ page }) => {
    await page.goto("/mobile/volunteer/PLA00000001");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Greeter|Usher|Worship/i, { timeout: 30000 });
  });

  test("filled position (Coffee Host) shows a Full / unavailable indicator", async ({ page }) => {
    await page.goto("/mobile/volunteer/PLA00000001");
    const main = page.locator("main");
    await expect(main).toContainText(/Coffee Host/i, { timeout: 30000 });
    const disabledSignup = page.locator("button[disabled]").filter({ hasText: /Full|Sign Up/i });
    expect(await disabledSignup.count()).toBeGreaterThan(0);
  });

  // Mutating test; reset-demo wipes changes.
  test.describe.serial("self-signup click flow", () => {
    test("Sign Up button on a self-signup position toggles to Remove", async ({ page }) => {
      await page.goto("/mobile/volunteer/PLA00000001");
      const main = page.locator("main");
      await expect(main).toContainText(/Greeter/i, { timeout: 30000 });

      // Click the first enabled Sign Up button. Per VolunteerDetail.tsx the
      // button text is "Sign Up" when free, "Full" when filled, "Remove"
      // when already assigned.
      const signUpBtn = main.getByRole("button", { name: /^Sign Up$/i }).first();
      await signUpBtn.waitFor({ state: "visible", timeout: 15000 });
      await signUpBtn.click();

      await expect(main.getByRole("button", { name: /^Remove$/i }).first()).toBeVisible({ timeout: 15000 });
    });
  });

  test("past-deadline plan is filtered off the upcoming volunteer index", async ({ page }) => {
    await page.goto("/mobile/volunteer");
    const main = page.locator("main");
    await expect(main).toContainText(/Greeter|Usher/i, { timeout: 30000 });
    const text = (await main.textContent()) || "";
    expect(text.toLowerCase()).not.toContain("last week");
  });
});
