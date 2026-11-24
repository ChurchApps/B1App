import { test, expect } from "@playwright/test";

// A member can take their profile photo down from the edit screen. The demo church has no
// directoryApprovalGroupId, so the removal saves the person row directly with the photo cleared.
// (Seeded PER0000* people always fall back to a demo avatar, so the check is on what gets saved.)
test.describe("Profile edit: remove photo", () => {
  test("Remove photo clears the photo and saves it with the person", async ({ page }) => {
    await page.goto("/mobile/profileEdit");
    await page.getByTestId("profile-edit-name").click({ timeout: 30000 });
    const remove = page.getByTestId("profile-remove-photo");
    await expect(remove).toBeVisible({ timeout: 30000 });
    await remove.click();
    await expect(remove).toHaveCount(0);

    const saveButton = page.getByRole("button", { name: /Save Changes|Submit for Approval/ });
    await expect(saveButton).toBeEnabled({ timeout: 30000 });
    await expect(saveButton).toHaveText("Save Changes");

    const saveRequest = page.waitForRequest((r) => r.method() === "POST" && /\/people$/.test(r.url()), { timeout: 30000 });
    await saveButton.click();
    const [saved] = (await saveRequest).postDataJSON();
    expect(saved.photo).toBe("");
    expect(saved.photoUpdated ?? null).toBeNull();
    await expect(page.getByText("Your changes have been saved.")).toBeVisible({ timeout: 15000 });
  });
});
