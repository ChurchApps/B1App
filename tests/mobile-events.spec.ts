import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Per b1-mobile/events/registering.md, the registration flow is a 3-step wizard
// (Info → Members → Confirm) loaded at /mobile/register/<eventId>. Seed events
// EVT00000015 (VBS) and EVT00000016 (Missions Conference) are seeded with
// registrationEnabled=1 and capacities (content/demo.sql).

test.describe("Mobile event registration", () => {
  test("VBS event renders Info step with title and capacity", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Vacation Bible School/i, {
      timeout: 15000,
    });
    // Capacity is 50 per seed; the Info step shows "X / 50 spots filled".
    await expect(page.locator("main")).toContainText(/\/ 50 spots filled/);
  });

  test("VBS Info step has a Continue button to advance to step 2", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    await expect(page.locator("main").getByRole("button", { name: /Continue/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("Missions Conference shows the not-yet-open state", async ({ page }) => {
    // Seeded with registrationOpenDate = today + 7 days, so registration
    // should not be open yet. Per EventRegisterPage.tsx:248-253 the page
    // shows "Registration opens <date>".
    await page.goto("/mobile/register/EVT00000016");
    await expect(page.locator("main")).toContainText(/Registration opens/i, { timeout: 15000 });
  });

  test("clicking Continue advances from Info to Members step", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    const continueBtn = page.locator("main").getByRole("button", { name: /Continue/i }).first();
    await continueBtn.waitFor({ state: "visible", timeout: 15000 });
    await continueBtn.click();
    // Step 2 shows family-member selection / add controls.
    await expect(page.locator("main")).toContainText(/Add family member|Family Members|Members/i, {
      timeout: 15000,
    });
  });

  test("unknown event id shows event-not-found state", async ({ page }) => {
    await page.goto("/mobile/register/EVT99999999");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Event not found|unavailable/i, {
      timeout: 15000,
    });
  });
});
