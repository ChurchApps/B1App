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

  test("/votd shows today's verse beside the picture and a looping strip of the past week", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/votd");
    const hero = page.getByTestId("votd-today");
    await expect(hero.getByRole("img", { name: /Verse of the Day/ })).toBeVisible({ timeout: 20000 });
    await expect(hero.getByTestId("votd-today-text")).not.toBeEmpty();
    const imgBox = await hero.getByRole("img").first().boundingBox();
    expect(imgBox!.height).toBeLessThanOrEqual(800 * 0.5 + 1);
    const strip = page.getByTestId("votd-week-strip");
    await expect(strip.getByTestId("votd-week-day")).toHaveCount(6);
    await expect(strip.getByTestId("votd-week-day").first().locator("p").last()).not.toBeEmpty();
    // The strip moves on its own when nobody is touching it.
    await page.mouse.move(0, 0);
    await expect.poll(() => strip.evaluate((el) => el.scrollLeft), { timeout: 15000 }).toBeGreaterThan(0);
  });

  test("/votd shares today's verse and a past day opens in a dialog to share or download", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any;
      w.__shared = [];
      Object.defineProperty(navigator, "share", { configurable: true, value: async (data: any) => { w.__shared.push({ text: data.text, url: data.url }); } });
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/votd");
    const hero = page.getByTestId("votd-today");
    await expect(hero.getByTestId("votd-today-text")).not.toBeEmpty({ timeout: 20000 });
    await expect(hero.getByRole("button", { name: "Share image" })).toBeVisible();
    await expect(hero.getByRole("button", { name: "Download" })).toBeVisible();
    await hero.getByRole("button", { name: "Share", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as any).__shared.length)).toBe(1);
    expect((await page.evaluate(() => (window as any).__shared[0])).url).toMatch(/\/16x9\.jpg$/);

    const card = page.getByTestId("votd-week-day").first();
    await expect(card.locator("p").nth(1)).not.toBeEmpty({ timeout: 15000 });
    const reference = (await card.locator("p").nth(1).textContent())!.trim();
    await card.click();
    const dialog = page.getByTestId("votd-day-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(reference);
    await expect(dialog.getByRole("img")).toHaveAttribute("src", /^https:\/\/votd\.org\/v1\/\d+\/16x9\.jpg$/);
    await expect(dialog.getByRole("button", { name: "Share image" })).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download" }).click();
    expect((await downloadPromise).suggestedFilename()).toMatch(/^votd-\d+\.jpg$/);
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  });

  test("/votd past verses lists this year's days under month headings", async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    test.skip(yesterday.getFullYear() !== new Date().getFullYear(), "No past verses on January 1");
    await page.goto("/votd");
    await page.getByRole("button", { name: "Past verses" }).click();
    const past = page.getByTestId("votd-past");
    await expect(past.getByRole("heading", { name: yesterday.toLocaleDateString("en-US", { month: "long" }) })).toBeVisible({ timeout: 15000 });
    await expect(past.getByRole("heading", { name: "January" })).toBeVisible();
    const rows = past.getByTestId("votd-past-row");
    await expect(rows.first()).toContainText(yesterday.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
    await rows.first().click();
    await expect(page.getByTestId("votd-day-dialog")).toBeVisible();
  });

  test("/this-page-does-not-exist returns 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
