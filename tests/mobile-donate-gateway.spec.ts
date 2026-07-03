import { test, expect } from "@playwright/test";

// Gateway is a church setting, never a donor choice; no processor selector regardless of gateway count.
test.describe("Donor never sees a payment-gateway selector", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("anonymous donate form renders with no processor picker", async ({ page }) => {
    await page.goto("/mobile/donate");

    const donateTab = page.getByRole("tab", { name: /^Donate$/i });
    await expect(donateTab).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole("textbox").first()).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole("combobox", { name: /Payment Provider/i })).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: /^Payment Method$/i })).toHaveCount(0);
    await expect(page.getByText(/Credit Card \(Stripe\)/i)).toHaveCount(0);
    await expect(page.getByText(/Credit Card \(PayPal\)/i)).toHaveCount(0);
    await expect(page.getByText(/^Kingdom Funding$/)).toHaveCount(0);
  });
});
