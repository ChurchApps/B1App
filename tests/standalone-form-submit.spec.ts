import { test, expect } from "@playwright/test";

// Repro for the "access denied when loading ..." report on VBS form submission.
// Anonymous parent loads a standalone (contentType="form") form and submits it.
// Seed forms come from Api membership demo.sql: FRM00000004 (public, restricted=0)
// and FRM00000005 (members-only, restricted=1). Run `npm run reset-demo` in Api first.
//
// Regression guard: FRM00000004 has a notification subscriber (memberPermissions
// MPR00000001) in demo.sql, so submitting it fires the /notifications/ping push.
// That ping was hardened to require messaging.admin and 401'd the whole anonymous
// submit until notifications were made non-fatal in FormSubmissionController.save.

test.describe("Standalone form submission (anonymous)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unrestricted form: anonymous parent can fill and submit", async ({ page }) => {
    const denied: string[] = [];
    page.on("console", (m) => { if (/access denied/i.test(m.text())) denied.push(m.text()); });

    let submitStatus = 0;
    page.on("response", (r) => {
      if (r.url().includes("/formsubmissions") && r.request().method() === "POST") submitStatus = r.status();
    });

    await page.goto("/forms/FRM00000004");

    // Questions render (both Textboxes are required)
    const input = page.getByLabel(/Child Full Name/i);
    await expect(input).toBeVisible({ timeout: 15000 });
    await input.fill("Test Kid");
    await page.getByLabel(/Emergency Contact Phone/i).fill("555-1234");

    // No "Access denied" banner during load
    await expect(page.locator("body")).not.toContainText(/access denied/i);

    await page.locator("#formSubmissionBox").getByRole("button", { name: /submit|save/i }).click();

    // Thank-you message from the form's thankYouMessage / formSubmitted label
    await expect(page.locator("body")).toContainText(/thank|submitted/i, { timeout: 15000 });
    expect(denied, "no access-denied error should appear").toHaveLength(0);
    expect(submitStatus, "POST /formsubmissions should be 200").toBe(200);
  });

  test("restricted form: anonymous parent is prompted to log in (not access-denied crash)", async ({ page }) => {
    await page.goto("/forms/FRM00000005");
    // FormPage shows a login link for restricted forms to anonymous users
    await expect(page.getByTestId("form-login-link")).toBeVisible({ timeout: 15000 });
  });
});
