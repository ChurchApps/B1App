import { test, expect } from "@playwright/test";

// Grace (giving/demo.sql) is seeded with TWO Stripe gateways (USD + GBP). That
// multi-gateway state used to make the donor donation form render a processor
// picker ("Payment Method" combobox listing "Credit Card (Stripe)" twice).
// Per product intent the gateway is a church setting, never a donor choice, so
// the donor must see a plain card form and NO processor selector regardless of
// how many gateways the church has configured.
//
// Runs anonymously (guest donation) — that's the path the mobile DonatePage
// routes through NonAuthDonation, which is the component the selector lived in.
test.describe("Donor never sees a payment-gateway selector", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("anonymous donate form renders with no processor picker", async ({ page }) => {
    await page.goto("/mobile/donate");

    // Guest sees only the Donate tab; its content is the donation form.
    const donateTab = page.getByRole("tab", { name: /^Donate$/i });
    await expect(donateTab).toBeVisible({ timeout: 30000 });

    // Form actually renders (no crash from the selector removal): the guest
    // name/email fields appear.
    await expect(page.getByRole("textbox").first()).toBeVisible({ timeout: 30000 });

    // The processor selector is gone: no combobox labelled "Payment Provider"
    // or "Payment Method", and no gateway brand options leak to the donor.
    await expect(page.getByRole("combobox", { name: /Payment Provider/i })).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: /^Payment Method$/i })).toHaveCount(0);
    await expect(page.getByText(/Credit Card \(Stripe\)/i)).toHaveCount(0);
    await expect(page.getByText(/Credit Card \(PayPal\)/i)).toHaveCount(0);
    await expect(page.getByText(/^Kingdom Funding$/)).toHaveCount(0);
  });
});
