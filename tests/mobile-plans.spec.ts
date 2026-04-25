import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile plans", () => {
  test("plans page renders with tabs", async ({ page }) => {
    await page.goto("/mobile/plans");
    await expect(mobileLogoutButton(page)).toBeVisible();
    const tabs = page.locator('[role="tab"]');
    await tabs.first().waitFor({ state: "visible", timeout: 15000 });
    await expect(page.locator('[role="tab"]').filter({ hasText: /Upcoming/i })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: /Past/i })).toBeVisible();
  });

  test("can switch between Upcoming and Past tabs", async ({ page }) => {
    await page.goto("/mobile/plans");
    const pastTab = page.locator('[role="tab"]').filter({ hasText: /Past/i });
    await pastTab.waitFor({ state: "visible", timeout: 15000 });
    await pastTab.click();
    await expect(pastTab).toHaveAttribute("aria-selected", "true");
  });

  test("Upcoming tab lists demo user's seeded Sound Tech assignment", async ({ page }) => {
    // Demo user (PER00000082) has assignment ASS00000008 for POS00000008
    // (Sound Tech) on plan PLA00000001 (Upcoming Worship Schedule), seeded
    // in doing/demo.sql:121.
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Sound Tech|Upcoming Worship Schedule/i, { timeout: 30000 });
  });

  test("clicking the assignment opens the plan detail (Service Order / Teams tabs)", async ({
    page,
  }) => {
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Sound Tech|Upcoming Worship Schedule/i, { timeout: 30000 });
    // The card surfaces the plan name as a clickable element.
    const card = main.getByText(/Upcoming Worship Schedule|Sound Tech/i).first();
    await card.click();
    await expect(page).toHaveURL(/\/mobile\/plans\/PLA\d+/, { timeout: 15000 });
    await expect(page.getByRole("tab", { name: /Service Order/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("tab", { name: /Teams/i })).toBeVisible();
  });

  test("Upcoming tab surfaces both demo user assignments (Sound Tech + Projection Tech)", async ({
    page,
  }) => {
    // ASS00000008 = Sound Tech (Accepted), ASS00000009 = Projection Tech
    // (Unconfirmed). Both belong to PLA00000001 with serviceDate next Sunday.
    // Per b1-mobile/serving/viewing-plans.md the Upcoming tab lists all upcoming
    // assignments for the user.
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Sound Tech/i, { timeout: 30000 });
    await expect(main).toContainText(/Projection Tech/i);
  });

  test("Unconfirmed assignment surfaces a respond / accept affordance", async ({ page }) => {
    // The doc describes a "needs response" hero card / per-assignment Accept
    // / Decline action when status is Unconfirmed. ASS00000009 is seeded with
    // status=Unconfirmed for demo user.
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Projection Tech/i, { timeout: 30000 });
    await expect(main).toContainText(/Accept|Respond|Pending Response|Unconfirmed/i);
  });
});
