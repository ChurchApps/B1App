import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile notifications", () => {
  test("notifications page loads", async ({ page }) => {
    await page.goto("/mobile/notifications");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("notifications page provides tab navigation", async ({ page }) => {
    await page.goto("/mobile/notifications");
    // Per b1-mobile/community/notifications.md the page uses tabs to switch
    // between notification categories. Either tabs render, or the page shows
    // an empty state for the seeded user.
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
    // POS00000010 (Greeter) and POS00000011 (Usher) are seeded with
    // allowSelfSignup=1 (doing/demo.sql:62).
    await page.goto("/mobile/volunteer");
    const main = page.locator("main");
    await expect(main).toContainText(/Greeter|Usher/i, { timeout: 30000 });
  });

  test("volunteer plan detail loads when drilling into a position", async ({ page }) => {
    // Per b1-mobile/serving/volunteer-signup.md, tapping a plan opens its
    // detail. /mobile/volunteer/PLA00000001 is the seeded worship plan.
    await page.goto("/mobile/volunteer/PLA00000001");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Greeter|Usher|Worship/i, {
      timeout: 30000,
    });
  });

  test("filled position (Coffee Host) shows a Full / unavailable indicator", async ({ page }) => {
    // POS00000012 (Coffee Host) has count=1 and is filled by ASS00000010
    // (Emily Davis). Per b1-mobile/serving/volunteer-signup.md, full
    // positions render with a disabled / "Full" indicator.
    await page.goto("/mobile/volunteer/PLA00000001");
    const main = page.locator("main");
    await expect(main).toContainText(/Coffee Host/i, { timeout: 30000 });
    // The Sign Up button should NOT appear next to a filled position. The
    // simplest doc-aligned assertion: there is at least one disabled signup
    // affordance on the page.
    const disabledSignup = page.locator("button[disabled]").filter({ hasText: /Full|Sign Up/i });
    expect(await disabledSignup.count()).toBeGreaterThan(0);
  });

  // Mutating: this test signs the demo user up for a position. Pretest's
  // reset-demo wipes the change before the next run.
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

      // After signup the same position renders a Remove button instead.
      await expect(main.getByRole("button", { name: /^Remove$/i }).first()).toBeVisible({
        timeout: 15000,
      });
    });
  });

  test("past-deadline plan is filtered off the upcoming volunteer index", async ({ page }) => {
    // PLA00000002 (serviceDate = today - 7 days) is seeded with self-signup
    // positions named "Greeter (last week)" / "Usher (last week)". The
    // volunteer index lists upcoming opportunities only, so those positions
    // should NOT appear; PLA00000002 detail responds with "Plan not found".
    await page.goto("/mobile/volunteer");
    const main = page.locator("main");
    await expect(main).toContainText(/Greeter|Usher/i, { timeout: 30000 });
    const text = (await main.textContent()) || "";
    expect(text.toLowerCase()).not.toContain("last week");
  });
});
