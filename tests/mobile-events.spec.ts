import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Per b1-mobile/events/registering.md, the registration flow is a 3-step wizard
// (Info → Members → Confirm) loaded at /mobile/register/<eventId>. Seed events
// EVT00000015 (VBS) and EVT00000016 (Missions Conference) exist but the
// events table does NOT seed `registrationEnabled` (the column is in the
// Event model but not in the migration), so the registration page renders
// the documented "Registration unavailable" state.

test.describe("Mobile event registration", () => {
  test("registration route loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("seeded event without registrationEnabled shows unavailable state", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    await expect(page.locator("main")).toContainText(/Registration unavailable/i, {
      timeout: 15000,
    });
  });

  test("unknown event id shows not-found / unavailable state", async ({ page }) => {
    await page.goto("/mobile/register/EVT99999999");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Event not found|unavailable/i, {
      timeout: 15000,
    });
  });
});
