import { test, expect } from "@playwright/test";

// Issue 1040 — the demo church has no directoryApprovalGroupId, so a member's profile
// edit is supposed to save immediately. Today handleSave always posts an (unassigned)
// directoryUpdate task and never touches the person record, so the change is lost.
test.describe("Issue 1040 — profile edit with no approval group", () => {
  test("middle name change persists after saving", async ({ page }) => {
    const middleName = "Quinlan";

    await page.goto("/mobile/profileEdit");
    await page.getByTestId("profile-edit-name").click({ timeout: 30000 });
    const middle = page.getByRole("textbox", { name: /Middle Name/i }).first();
    await expect(middle).toBeVisible({ timeout: 30000 });

    // Clear first: React suppresses onChange when a fill re-enters the identical value,
    // so a re-run against an already-saved "Quinlan" would show no pending changes.
    await middle.fill("");
    await middle.fill(middleName);

    const saveButton = page.getByRole("button", { name: /Save Changes|Submit for Approval/ });
    await expect(saveButton).toBeEnabled({ timeout: 30000 });
    // Demo church has no directoryApprovalGroupId, so the button must promise a direct save.
    await expect(saveButton).toHaveText("Save Changes");

    // The person row itself must be posted — a directoryUpdate task does not count.
    const saveResponse = page.waitForResponse(
      (r) => r.request().method() === "POST" && /\/people\b/.test(r.url()) && !/\/tasks/.test(r.url()),
      { timeout: 30000 }
    );
    await saveButton.click();
    await saveResponse;
    await expect(page.getByText("Your changes have been saved.")).toBeVisible({ timeout: 15000 });

    // handleSave calls router.back() ~900ms after success; let that navigation finish so
    // it cannot abort the reload below.
    await page.waitForTimeout(1500);

    await page.goto("/mobile/profileEdit");
    // IndexedDB caching prevents refetch; clear it so the reload reads the server row.
    await page.evaluate(async () => {
      for (const db of await indexedDB.databases()) if (db.name) indexedDB.deleteDatabase(db.name);
    });
    await page.reload();
    await page.getByTestId("profile-edit-name").click({ timeout: 30000 });

    const reloaded = page.getByRole("textbox", { name: /Middle Name/i }).first();
    await expect(reloaded).toBeVisible({ timeout: 30000 });
    await expect(reloaded).toHaveValue(middleName, { timeout: 15000 });
  });

  test("the Add Family Member sheet doesn't promise a staff review", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await page.getByTestId("profile-edit-household").click({ timeout: 30000 });
    await expect(page.getByText("New members join your household when you save.")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/reviewed along with your other profile changes/)).toHaveCount(0);

    await page.getByTestId("family-member-first").fill("Pat");
    await page.getByTestId("family-member-add").click();
    await expect(page.getByText("Pending Family Members")).toBeVisible();
    await expect(page.getByText("These will be added to your household when you save.")).toBeVisible();
    await expect(page.getByText(/submitted with your profile changes for approval/)).toHaveCount(0);
    // Leave without saving so the household isn't changed.
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByTestId("confirm-discard-changes").click();
  });
});
