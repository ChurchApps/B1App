import { test, expect } from "@playwright/test";

// Built-in routes (votd, bible, donate, stream, sermons) render wrappers regardless of custom pages

test.describe("Public built-in routes", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("/donate renders donation page", async ({ page }) => {
    await page.goto("/donate");
    await expect(page).toHaveURL(/\/donate/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("/donate references seeded fund (General Fund)", async ({ page }) => {
    await page.goto("/donate");
    // Fund picker or login prompt, but URL stays on /donate.
    const body = page.locator("body");
    await body.waitFor({ state: "visible", timeout: 15000 });
    const text = (await body.textContent()) || "";
    expect(/General Fund|login|Sign In/i.test(text)).toBe(true);
  });

  test("/donate hides the wallet buttons until a fund amount is entered", async ({ page }) => {
    await page.goto("/donate");
    await page.locator('input[name="amount"]').first().waitFor({ state: "visible", timeout: 30000 });
    await expect(page.getByTestId("express-checkout")).toHaveCount(0);
  });

  test("/donate offers Apple Pay / Google Pay once fund and amount are set", async ({ page }) => {
    await page.goto("/donate");
    const amount = page.locator('input[name="amount"]').first();
    await amount.waitFor({ state: "visible", timeout: 30000 });
    await amount.fill("25");
    await expect(page.getByTestId("express-checkout")).toBeAttached({ timeout: 20000 });
    // Wallet availability is browser-dependent, so pin the mount point and its iframe rather than a button.
    await expect(page.getByTestId("express-checkout").locator("iframe")).toBeAttached({ timeout: 20000 });
  });

  test("/donate still collects a card alongside the wallet buttons", async ({ page }) => {
    await page.goto("/donate");
    const amount = page.locator('input[name="amount"]').first();
    await amount.waitFor({ state: "visible", timeout: 30000 });
    await amount.fill("25");
    await expect(page.getByTestId("express-checkout")).toBeAttached({ timeout: 20000 });
    await expect(page.frameLocator('iframe[title="Secure card number input frame"]').locator('[name="cardnumber"]')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("button", { name: "Donate", exact: true })).toBeVisible();
  });

  // FUN00000002 = "Building Fund" (demo.sql), a non-default fund so preselection is provable.
  test("/donate?fundId=&amount= preselects the fund and amount", async ({ page }) => {
    await page.goto("/donate?fundId=FUN00000002&amount=25");
    const amountInput = page.locator('input[name="amount"]').first();
    await amountInput.waitFor({ state: "visible", timeout: 15000 });
    await expect(amountInput).toHaveValue("25");
    await expect(page.getByText("Building Fund").first()).toBeVisible();
    await expect(page.getByText(/Total Donation Amount:\s*\$\s*25\.00/)).toBeVisible({ timeout: 15000 });
  });

  test("/stream renders streaming page", async ({ page }) => {
    await page.goto("/stream");
    await expect(page).toHaveURL(/\/stream/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("/bible renders YouVersion bible reader", async ({ page }) => {
    await page.goto("/bible");
    await expect(page).toHaveURL(/\/bible/);
    await expect(page.getByTestId("bible-previous-chapter-button")).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("bible-next-chapter-button")).toBeVisible();
  });

  test("/votd renders verse-of-the-day page", async ({ page }) => {
    await page.goto("/votd");
    await expect(page).toHaveURL(/\/votd/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("/this-page-does-not-exist returns 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
