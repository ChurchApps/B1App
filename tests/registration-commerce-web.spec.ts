import { test, expect, type Page } from "@playwright/test";

const VBS = "EVT00000015";
const TSHIRT = "RGS00000001";

// Gate on count fetch (post-hydration) to avoid losing input values during hydration.
async function gotoWizard(page: Page, eventId: string) {
  const countResp = page.waitForResponse((r) => r.url().includes(`/registrations/event/${eventId}/count`), { timeout: 30000 });
  await page.goto(`/register/${eventId}`);
  await countResp;
}

test.describe("Public web registration wizard (guest)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("guest reaches payment with correct total, coupon discounts it", async ({ page }) => {
    await gotoWizard(page, VBS);
    const main = page.locator("main");

    const first = main.getByLabel("First Name");
    await expect(async () => {
      await first.fill("Web");
      await expect(first).toHaveValue("Web", { timeout: 1000 });
    }).toPass({ timeout: 20000 });
    await main.getByLabel("Last Name").fill("Guest");
    await main.getByLabel("Email").fill(`webguest+${Date.now()}@example.com`);
    await page.getByTestId("primary-type").click();
    await page.getByRole("option", { name: /Chaperone/i }).click();
    await main.getByRole("button", { name: /^Continue$/i }).click();

    await expect(main.getByText("Additional Members")).toBeVisible({ timeout: 10000 });
    await main.getByRole("button", { name: /Continue/i }).click();

    await page.getByTestId("sel-add-" + TSHIRT).click();
    await expect(page.getByTestId("sel-qty-" + TSHIRT)).toHaveText("1");
    await main.getByRole("button", { name: /Continue/i }).click();

    await expect(page.getByTestId("reg-total")).toHaveText("$27.00", { timeout: 25000 });

    await page.getByTestId("reg-coupon-input").locator("input").fill("EARLYBIRD");
    await page.getByTestId("reg-coupon-apply").click();
    await expect(page.getByTestId("reg-total")).toHaveText("$24.30", { timeout: 15000 });

    await expect(page.locator('iframe[title="Secure card payment input frame"]')).toBeVisible({ timeout: 20000 });
  });
});
