import { test, expect } from "@playwright/test";

// Issue 1040 — the demo church has no directoryApprovalGroupId, so a member's profile
// edit is supposed to save immediately. Today handleSave always posts an (unassigned)
// directoryUpdate task and never touches the person record, so the change is lost.
test.describe("Issue 1040 — profile edit with no approval group", () => {
  test("middle name change persists after saving", async ({ page }) => {
    const middleName = "Quinlan";

    await page.goto("/mobile/profileEdit");
    const middle = page.getByRole("textbox", { name: /Middle Name/i }).first();
    await expect(middle).toBeVisible({ timeout: 30000 });

    await middle.fill(middleName);

    const saveButton = page.getByRole("button", { name: /Save Changes|Submit for Approval/i });
    await expect(saveButton).toBeVisible();

    const saveResponse = page.waitForResponse(
      (r) => r.request().method() === "POST" && /\/(people|tasks)/.test(r.url()),
      { timeout: 30000 }
    );
    await saveButton.click();
    await saveResponse;

    await page.goto("/mobile/profileEdit");
    const reloaded = page.getByRole("textbox", { name: /Middle Name/i }).first();
    await expect(reloaded).toBeVisible({ timeout: 30000 });
    await expect(reloaded).toHaveValue(middleName, { timeout: 15000 });
  });
});
