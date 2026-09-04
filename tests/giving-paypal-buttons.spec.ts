import { test, expect, type Page } from "@playwright/test";

// Grace runs on Stripe, so the PayPal gateway is stubbed at the gateway endpoints and the PayPal SDK
// script is replaced with a button that drives createOrder -> onApprove. Everything else is the real app.
const PAYPAL_GATEWAY = {
  id: "GAT-PAYPAL-TEST",
  provider: "PayPal",
  publicKey: "sb-paypal-test-client-id",
  payFees: false,
  currency: "usd",
  enabled: true
};

const FAKE_SDK = `
window.paypal = {
  HostedFields: { isEligible: function () { return false; } },
  Buttons: function (options) {
    return {
      isEligible: function () { return true; },
      close: function () {},
      render: function (target) {
        var el = typeof target === "string" ? document.querySelector(target) : target;
        var button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-testid", "fake-paypal-button");
        button.textContent = "PayPal";
        button.addEventListener("click", function () {
          Promise.resolve(options.createOrder()).then(function (orderId) {
            return options.onApprove({ orderID: orderId });
          }).catch(function (e) { if (options.onError) options.onError(e); });
        });
        el.appendChild(button);
        return Promise.resolve();
      }
    };
  }
};
`;

async function stubPayPal(page: Page): Promise<() => string> {
  let sdkUrl = "";
  await page.route("https://www.paypal.com/sdk/js*", (route) => {
    sdkUrl = route.request().url();
    return route.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_SDK });
  });
  await page.route("**/giving/gateways", (route) => route.fulfill({ json: [PAYPAL_GATEWAY] }));
  await page.route("**/giving/donate/gateways/**", (route) => route.fulfill({ json: { gateways: [PAYPAL_GATEWAY] } }));
  return () => sdkUrl;
}

async function openDonateTab(page: Page) {
  await page.goto("/mobile/donate");
  const tab = page.getByRole("tab", { name: /^Donate$/i });
  await tab.waitFor({ state: "visible", timeout: 30000 });
  await tab.click();
  await page.locator("#single-donation-button").waitFor({ state: "visible", timeout: 15000 });
  await page.locator("#donation-details").waitFor({ state: "visible", timeout: 15000 });
}

test.describe("PayPal wallet buttons on the guest form", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("PayPal/Venmo buttons render alongside the card fields", async ({ page }) => {
    const sdkUrl = await stubPayPal(page);
    await page.goto("/mobile/donate");
    await page.locator('input[name="firstName"]').waitFor({ state: "visible", timeout: 30000 });

    await expect(page.getByTestId("paypal-buttons").getByTestId("fake-paypal-button")).toBeVisible({ timeout: 20000 });
    const url = decodeURIComponent(sdkUrl());
    expect(url).toContain("components=buttons,hosted-fields");
    expect(url).toContain("enable-funding=venmo");
  });
});

test.describe("PayPal wallet buttons on the member form", () => {
  test("approved wallet order is charged with the PayPal order id", async ({ page }) => {
    await stubPayPal(page);
    let orderRequest: any = null;
    let chargeRequest: any = null;
    await page.route("**/giving/donate/create-order", (route) => {
      orderRequest = route.request().postDataJSON();
      return route.fulfill({ json: { id: "ORDER-TEST-1", status: "CREATED", provider: "paypal" } });
    });
    await page.route("**/giving/donate/charge", (route) => {
      chargeRequest = route.request().postDataJSON();
      return route.fulfill({ json: { id: "CAPTURE-TEST-1", status: "COMPLETED", provider: "paypal" } });
    });

    await openDonateTab(page);
    await expect(page.getByTestId("paypal-buttons")).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="amount"]').first().fill("25");
    await page.getByTestId("fake-paypal-button").click();

    await expect(page.getByText(/PayPal payment approved/i)).toBeVisible({ timeout: 20000 });
    expect(orderRequest).toMatchObject({ provider: "paypal", amount: 25, currency: "USD" });

    await page.locator('button[aria-label="save-button"]').click();
    const donateBtn = page.locator('button[aria-label="donate-button"]');
    await donateBtn.waitFor({ state: "visible", timeout: 10000 });
    await donateBtn.click();

    await expect(page.getByText(/Thank you for your donation/i)).toBeVisible({ timeout: 30000 });
    expect(chargeRequest).toMatchObject({ provider: "paypal", id: "ORDER-TEST-1", amount: 25 });
  });

  test("wallet buttons are hidden for recurring gifts", async ({ page }) => {
    await stubPayPal(page);
    await openDonateTab(page);
    await expect(page.getByTestId("paypal-buttons")).toBeVisible({ timeout: 20000 });
    await page.locator("#recurring-donation-button").click();
    await page.locator("#donation-details").waitFor({ state: "visible", timeout: 15000 });
    await expect(page.getByTestId("paypal-buttons")).toHaveCount(0);
  });
});
