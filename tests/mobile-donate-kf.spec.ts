import { test, expect, type Page } from "@playwright/test";
import { getApi, apiCall } from "./helpers/api";

// Kingdom Funding (NMI white-label host) member donations against the demo church's live KF test gateway.
test.describe.configure({ mode: "serial" });

const CARD_OK = "4111111111111111";
// NMI rejects same card+amount within its duplicate window; vary cents per run.
const uniqueAmount = (base: number) => (base + Math.floor(Math.random() * 900 + 1) / 100).toFixed(2);

async function fillKfCard(page: Page, number: string) {
  const num = page.frameLocator("#kf-ccnumber iframe").locator("#ccnumber");
  await num.waitFor({ state: "visible", timeout: 30000 });
  await num.fill(number);
  await page.frameLocator("#kf-ccexp iframe").locator("#ccexp").fill("1227");
  await page.frameLocator("#kf-cvv iframe").locator("#cvv").fill("999");
  // Collect.js validates on blur; tokenizing before that settles fails silently.
  await page.locator('input[name="amount"]').first().click();
  await page.waitForTimeout(750);
}

function captureDiagnostics(page: Page) {
  const log: string[] = [];
  page.on("console", (m) => { if (m.type() === "error" && !/IDBObjectStore|status of 429|Hydration|Content Security Policy|PaymentRequestAbstraction|script tag/.test(m.text())) log.push(`[console.error] ${m.text().slice(0, 500)}`); });
  const t0 = Date.now();
  page.on("request", (r) => { if (/transactiongateway\.com/.test(r.url())) log.push(`[+${Date.now() - t0}ms req] ${r.method()} ${r.url().slice(0, 120)}`); });
  page.on("response", (r) => { if (/transactiongateway\.com\/token\/api/.test(r.url())) log.push(`[+${Date.now() - t0}ms res ${r.status()}] ${r.url().slice(0, 120)}`); });
  page.on("response", async (r) => {
    const u = r.url();
    if (/\/donate\/(charge|subscribe)|\/paymentmethods|\/subscriptions/.test(u)) {
      let body = "";
      try { body = JSON.stringify(await r.json()); } catch { /* non-json */ }
      log.push(`[${r.request().method()} ${r.status()}] ${u.replace(/^https?:\/\/[^/]+/, "")} -> ${body.slice(0, 400)}`);
    }
  });
  return log;
}

async function openDonateTab(page: Page) {
  await page.goto("/mobile/donate");
  const tab = page.getByRole("tab", { name: /^Donate$/i });
  await tab.waitFor({ state: "visible", timeout: 20000 });
  await tab.click();
  await page.locator("#single-donation-button").waitFor({ state: "visible", timeout: 15000 });
}

async function openManageTab(page: Page) {
  await page.goto("/mobile/donate");
  const tab = page.getByRole("tab", { name: /Manage/i });
  await tab.waitFor({ state: "visible", timeout: 20000 });
  await tab.click();
  await page.getByRole("heading", { name: "Payment Methods" }).waitFor({ state: "visible", timeout: 20000 });
}

async function deleteAllCards(page: Page) {
  page.on("dialog", (d) => d.accept());
  await openManageTab(page);
  for (let i = 0; i < 8; i++) {
    const count = await page.getByLabel("edit-button").count();
    if (count === 0) break;
    await page.getByLabel("edit-button").first().click();
    await page.locator('button[aria-label="delete-button"], button:has-text("Delete")').first().click();
    await expect(page.getByLabel("edit-button")).toHaveCount(count - 1, { timeout: 20000 });
  }
}

// Browser-side delete can report "Failed to fetch" while the Api is still detaching at NMI; clean up server-side instead.
async function deleteAllCardsViaApi() {
  const api = await getApi("demo");
  const res = await apiCall(api, "get", "http://localhost:8084/giving/paymentmethods/personid/PER00000082");
  const pms: any[] = await res.json();
  for (const pm of pms) {
    const del = await apiCall(api, "delete", `http://localhost:8084/giving/paymentmethods/${pm.id}/${pm.customerId}?provider=${pm.provider}`);
    expect(del.ok(), `delete ${pm.id}: ${del.status()}`).toBe(true);
  }
}

async function submitDonation(page: Page) {
  await page.locator('button[aria-label="save-button"]').click();
  const donateBtn = page.locator('button[aria-label="donate-button"]');
  await donateBtn.waitFor({ state: "visible", timeout: 10000 });
  await donateBtn.click();
  // Surface the transient error toast (it disappears before the 45s success wait gives up).
  const seen = new Set<string>();
  const clickedAt = Date.now();
  for (let i = 0; i < 60; i++) {
    for (const t of await page.locator('[role="alert"]').allTextContents()) if (t.trim() && !seen.has(t.trim())) seen.add(`+${Date.now() - clickedAt}ms ${t.trim()}`);
    if ([...seen].some((t) => /thank you|created|tokenize/i.test(t))) break;
    await page.waitForTimeout(500);
  }
  console.log("TOASTS: " + JSON.stringify([...seen]));
}

test.describe.serial("Kingdom Funding member donations (live NMI test gateway)", () => {
  test("one-time donation with a new card (Collect.js from new host)", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await deleteAllCardsViaApi();
    await openDonateTab(page);
    await page.locator("#donation-details").waitFor({ state: "visible", timeout: 15000 });
    await page.locator('input[name="amount"]').first().fill(uniqueAmount(5));
    await page.getByLabel(/Save this card/i).check();
    await fillKfCard(page, CARD_OK);
    await submitDonation(page);

    let ok = true;
    await expect(page.getByText(/Thank you for your donation/i)).toBeVisible({ timeout: 45000 }).catch(() => { ok = false; });
    if (!ok) console.log("ALERTS: " + JSON.stringify(await page.locator('[role="alert"]').allTextContents()));
    console.log("DIAG:\n" + diag.join("\n"));
    expect(diag.some((l) => l.includes("lotusconsulting.transactiongateway.com/token/Collect.js")), "Collect.js not loaded from new host").toBe(true);
    expect(ok, "No success Alert after one-time donation").toBe(true);
  });

  test("saved card appears on Manage tab", async ({ page }) => {
    await openManageTab(page);
    await expect(page.getByText(/\*{2,4}1111/).first()).toBeVisible({ timeout: 20000 });
  });

  test("recurring donation with the saved card, then cancel it", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await openDonateTab(page);
    await page.locator("#recurring-donation-button").click();
    await page.locator("#frequency-select").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#donation-details").waitFor({ state: "visible", timeout: 15000 });
    await page.locator('input[name="amount"]').first().fill(uniqueAmount(10));
    const select = page.locator("#payment-method-select");
    const frame = page.locator("#kf-ccnumber iframe");
    await expect(select.or(frame).first()).toBeVisible({ timeout: 20000 });
    if (await frame.count()) await fillKfCard(page, CARD_OK);
    await submitDonation(page);

    let ok = true;
    await expect(page.getByText(/Recurring donation created|Thank you for your donation/i)).toBeVisible({ timeout: 45000 }).catch(() => { ok = false; });
    console.log("DIAG:\n" + diag.join("\n"));
    expect(ok, "No success Alert after recurring donation").toBe(true);

    const subId = diag.map((l) => l.match(/subscribe.*"subscription_id":"(\d+)"/)?.[1]).find(Boolean);
    expect(subId, "subscription_id missing from /donate/subscribe response").toBeTruthy();

    // Mobile History lists recurring gifts read-only; payment data can lag one load behind.
    await expect(async () => {
      await page.goto("/mobile/donate");
      await page.getByRole("tab", { name: /History/i }).click();
      await expect(page.getByText(/Every 1 month/i).first()).toBeVisible({ timeout: 10000 });
    }).toPass({ timeout: 60000 }).catch(() => { console.log("DIAG:\n" + diag.join("\n")); throw new Error("recurring gift not listed on History tab"); });

    const api = await getApi("demo");
    const del = await apiCall(api, "delete", `http://localhost:8084/giving/subscriptions/${subId}`);
    expect(del.ok(), `cancel subscription ${subId}: ${del.status()}`).toBe(true);
  });

  test("delete the saved card", async ({ page }) => {
    await deleteAllCards(page);
    await expect(page.getByLabel("edit-button")).toHaveCount(0);
  });
});
