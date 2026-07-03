import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Confidential groups: GRP00000031 "Care & Recovery" (confidential=1). demo is a
// member. The public finder must exclude it (server-gated); demo's my-groups shows it.

test.describe("Confidential groups", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("public groups finder does not list the confidential group", async ({ page }) => {
    await page.goto("/groups", { waitUntil: "networkidle" });
    await expect(page.locator('[data-testid="groups-browser"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator("body")).not.toContainText("Care & Recovery");
  });
});

test.describe("Confidential groups (member view)", () => {
  test("demo's my-groups includes the confidential group and its members tab renders", async ({ page }) => {
    await page.goto("/mobile/groups");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    await expect(page.locator("main")).toContainText("Care & Recovery", { timeout: 15000 });

    // Open it and confirm the members tab renders without crashing.
    await page.goto("/mobile/groups/GRP00000031");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    await page.getByRole("tab", { name: /Members/i }).click();
    await expect(page.locator("main")).toContainText(/Members/i, { timeout: 15000 });
  });
});
