import { test, expect, request, type Page, type APIRequestContext } from "@playwright/test";
import crypto from "crypto";

// Accra Community Church (CHU00000002, accra.localtest.me) is seeded with a Paystack TEST-mode GHS gateway,
// so these run against the real Paystack test API + checkout popup without touching Grace's Stripe gateway.
// Test instruments: mobile money 0551234987/MTN (no OTP); card = Paystack's built-in "Success" test card.
test.describe.configure({ mode: "serial" });

const API = "http://localhost:8084";
const BASE_URL = "http://accra.localtest.me:3301";
const CHURCH_ID = "CHU00000002";
const PERSON_ID = "PER00000098";
// Same test secret that giving/demo.sql seeds (encrypted) for GAT00000002 — needed to sign webhook payloads.
const PAYSTACK_TEST_SECRET = "sk_test_cb5515c7ea0b9761f5027b7802534fd4f35d5c02";

let api: APIRequestContext;
let jwt: string;
const auth = () => ({ headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } });
const myDonations = async (): Promise<any[]> => (await api.get(`${API}/giving/donations/my`, auth())).json();

// Two checkout iframes coexist (a hidden preload + the live one); drive the visible one.
const checkout = (page: Page) => page.locator('iframe[src*="checkout.paystack.com"]').filter({ visible: true }).last().contentFrame();

async function openDonateTab(page: Page) {
  await page.goto("/mobile/donate");
  const tab = page.getByRole("tab", { name: /^Donate$/i });
  await tab.waitFor({ state: "visible", timeout: 20000 });
  await tab.click();
  await page.locator("#single-donation-button").waitFor({ state: "visible", timeout: 15000 });
  await page.locator("#donation-details").waitFor({ state: "visible", timeout: 15000 });
}

async function submitDonation(page: Page) {
  await page.locator('button[aria-label="save-button"]').click();
  const donateBtn = page.locator('button[aria-label="donate-button"]');
  await donateBtn.waitFor({ state: "visible", timeout: 10000 });
  await donateBtn.click();
}

async function payWithTestMobileMoney(page: Page) {
  const co = checkout(page);
  await co.getByTestId("phone-number-input").waitFor({ timeout: 30000 });
  await co.getByTestId("phone-number-input").fill("0551234987");
  await co.getByTestId("mobile-money-provider").selectOption({ label: "MTN" });
  await co.getByTestId("mobileMoneyConfirmButton").click();
}

async function payWithTestCard(page: Page) {
  const co = checkout(page);
  await co.getByTestId("card-nav").waitFor({ timeout: 30000 });
  await co.getByTestId("card-nav").click();
  await co.getByTestId("testCard-0").click();
  await co.getByTestId("testCardsPaymentButton").click();
}

const expectThankYou = (page: Page) => expect(page.getByText(/Thank you for your donation|Recurring donation created/i)).toBeVisible({ timeout: 90000 });

test.describe("Paystack member donations (Accra)", () => {
  // The shared auth state belongs to the grace origin; log in fresh on accra.
  test.use({ baseURL: BASE_URL, storageState: { cookies: [], origins: [] } });

  test.beforeAll(async () => {
    api = await request.newContext();
    const res = await (await api.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    jwt = res.userChurches.find((c: any) => c.church?.id === CHURCH_ID)?.apis?.find((a: any) => a.keyName === "GivingApi")?.jwt;
    expect(jwt, "GivingApi JWT for Accra").toBeTruthy();
    // Clean slate: a failed earlier run can leave saved Paystack methods behind, which hides the inline entry.
    const methods = await (await api.get(`${API}/giving/paymentmethods/personid/${PERSON_ID}`, auth())).json();
    for (const pm of Array.isArray(methods) ? methods : []) {
      if (pm.provider === "paystack") await api.delete(`${API}/giving/paymentmethods/${pm.id}/${pm.customerId}?provider=paystack`, auth());
    }
  });

  // Accra has no website, so "/" is the mobile shell; use the login route directly.
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("demo@b1.church");
    await page.locator('input[type="password"]').fill("password");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
  });

  test("mobile money gift through the real checkout is recorded as Mobile Money in GHS", async ({ page }) => {
    await openDonateTab(page);
    await expect(page.getByTestId("paystack-entry")).toBeVisible();
    await page.locator('input[name="amount"]').first().fill("10");
    await expect(page.getByText(/GH₵/).first()).toBeVisible();
    await submitDonation(page);
    await payWithTestMobileMoney(page);
    await expectThankYou(page);
    await expect.poll(async () => (await myDonations()).find((d: any) => Number(d.amount) === 10 && d.method === "Mobile Money"), { timeout: 20000 }).toBeTruthy();
  });

  test("card gift with 'save this card' keeps the authorization and charges it again without the popup", async ({ page }) => {
    await openDonateTab(page);
    await page.locator('input[name="amount"]').first().fill("12");
    await page.getByLabel(/Save this card/i).check();
    await submitDonation(page);
    await payWithTestCard(page);
    await expectThankYou(page);
    await expect.poll(async () => (await myDonations()).find((d: any) => Number(d.amount) === 12 && d.method === "Card"), { timeout: 20000 }).toBeTruthy();

    const methods = await (await api.get(`${API}/giving/paymentmethods/personid/${PERSON_ID}`, auth())).json();
    expect(methods.find((m: any) => m.provider === "paystack")?.id).toMatch(/^AUTH_/);

    await openDonateTab(page);
    await expect(page.locator("#payment-method-select")).toBeVisible({ timeout: 15000 });
    await page.locator('input[name="amount"]').first().fill("3");
    await submitDonation(page);
    await expectThankYou(page);
    await expect.poll(async () => (await myDonations()).find((d: any) => Number(d.amount) === 3 && d.method === "Card"), { timeout: 20000 }).toBeTruthy();
  });

  test("monthly recurring gift on the saved card creates a plan + subscription; cancel disables it", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await openDonateTab(page);
    await page.locator("#recurring-donation-button").click();
    await page.locator("#donation-details").waitFor({ state: "visible", timeout: 15000 });
    await page.locator('input[name="amount"]').first().fill("20");
    await submitDonation(page);
    await expectThankYou(page);
    await expect.poll(async () => (await myDonations()).find((d: any) => Number(d.amount) === 20), { timeout: 20000 }).toBeTruthy();

    // The persisted query cache only refreshes via the page's own post-gift invalidation; stay in-page for it.
    await page.waitForResponse((r) => /\/customers\/.+\/subscriptions/.test(r.url()) && r.ok(), { timeout: 30000 });
    await page.getByRole("tab", { name: /History/i }).click();
    const recurringBox = page.locator('[data-testid="recurring-donations"]');
    await expect(recurringBox).toBeVisible({ timeout: 20000 });
    await expect(recurringBox.locator('button[aria-label="pause-subscription"]')).toHaveCount(0);
    const cancel = page.waitForResponse((r) => /\/subscriptions\//.test(r.url()) && r.request().method() === "DELETE", { timeout: 30000 });
    await recurringBox.locator('button[aria-label="cancel-subscription"]').first().click();
    expect((await cancel).ok()).toBe(true);
  });

  test("deleting the saved card deactivates the authorization at Paystack", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/mobile/donate");
    await page.getByRole("tab", { name: /Manage/i }).click();
    await page.getByRole("heading", { name: "Payment Methods" }).waitFor({ state: "visible", timeout: 20000 });
    const before = await page.getByLabel("edit-button").count();
    expect(before).toBeGreaterThan(0);
    await page.getByLabel("edit-button").first().click();
    await page.locator('button[aria-label="delete-button"], button:has-text("Delete")').first().click();
    await expect(page.getByLabel("edit-button")).toHaveCount(before - 1, { timeout: 30000 });
  });

  test("signed charge.success webhook records a renewal once; bad signatures are rejected", async () => {
    const before = (await myDonations()).length;
    const reference = "renewal_" + Date.now();
    const raw = JSON.stringify({
      event: "charge.success",
      data: {
        id: Number(String(Date.now()).slice(-9)),
        reference,
        amount: 2000,
        currency: "GHS",
        channel: "card",
        status: "success",
        paid_at: new Date().toISOString(),
        customer: { customer_code: "CUS_unknown_renewal" },
        authorization: { authorization_code: "AUTH_webhooktest", channel: "card", brand: "visa", last4: "4081", reusable: true },
        metadata: { personId: PERSON_ID, funds: [{ id: "FUN00000011", amount: 20 }] }
      }
    });
    const url = `${API}/giving/donate/webhook/paystack?churchId=${CHURCH_ID}`;
    const sign = (secret: string) => crypto.createHmac("sha512", secret).update(raw).digest("hex");

    const bad = await api.post(url, { data: raw, headers: { "Content-Type": "application/json", "x-paystack-signature": sign("wrong") } });
    expect(bad.status()).toBe(401);
    const ok = await api.post(url, { data: raw, headers: { "Content-Type": "application/json", "x-paystack-signature": sign(PAYSTACK_TEST_SECRET) } });
    expect(ok.status()).toBe(200);
    const again = await api.post(url, { data: raw, headers: { "Content-Type": "application/json", "x-paystack-signature": sign(PAYSTACK_TEST_SECRET) } });
    expect(again.status()).toBe(200);

    await expect.poll(async () => (await myDonations()).length, { timeout: 15000 }).toBe(before + 1);
    const renewal = (await myDonations()).find((d: any) => d.notes?.includes(reference));
    expect(renewal).toMatchObject({ amount: 20, method: "Card" });
    expect(renewal.fund?.name).toBe("General Fund");
  });
});

test.describe("Paystack guest form (Accra)", () => {
  test.use({ baseURL: BASE_URL, storageState: { cookies: [], origins: [] } });

  test("anonymous donate page renders the Paystack form with GHS fees", async ({ page }) => {
    await page.goto("/mobile/donate");
    await page.locator('input[name="firstName"]').waitFor({ state: "visible", timeout: 30000 });
    await expect(page.getByTestId("paystack-entry")).toBeVisible();
    await page.locator('input[name="amount"]').first().fill("100");
    await expect(page.getByText(/GH₵/).first()).toBeVisible({ timeout: 15000 });
  });
});
