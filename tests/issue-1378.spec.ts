import { test, expect, type Page } from "@playwright/test";

// Issue #1378: in the group "Add Event" dialog, turning on Recurring (Frequency
// defaults to Week) shows the S M T W T F S day buttons. Each button kept MUI's
// 64px minimum width inside a 5/12-wide cell, so the row ran past the dialog's
// right edge and the last Saturday button was cut off.
test.describe("Issue 1378 - weekly recurrence day buttons fit the dialog", () => {
  const GROUP_ID = "GRP00000023";

  async function openRecurringEditor(page: Page) {
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    await page.getByRole("button", { name: /^All events$/i }).click();
    const addBtn = page.getByRole("button", { name: /^Add Event$/i });
    await addBtn.waitFor({ state: "visible", timeout: 15000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog").filter({ hasText: /New Event/i });
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.getByRole("switch", { name: /Recurring/i }).check();
    return dialog;
  }

  for (const width of [1280, 390]) {
    test(`Saturday button sits inside the dialog at ${width}px wide`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const dialog = await openRecurringEditor(page);

      const saturday = dialog.getByTestId("weekday-s-button").last();
      await expect(saturday).toBeVisible({ timeout: 5000 });
      const content = dialog.locator(".MuiDialogContent-root");

      const satBox = await saturday.boundingBox();
      const contentBox = await content.boundingBox();
      expect(satBox && contentBox).toBeTruthy();
      expect(satBox!.x + satBox!.width).toBeLessThanOrEqual(contentBox!.x + contentBox!.width);
    });
  }
});
