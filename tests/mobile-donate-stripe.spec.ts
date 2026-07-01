import { test, expect, type Page } from "@playwright/test";

// Real end-to-end Stripe test-mode donations against the demo Grace gateway
// (pk_test_..., USD, seeded in giving/demo.sql). These drive the actual Stripe
// CardElement iframe with test cards and hit /donate/charge, /donate/subscribe,
// and /paymentmethods/* for real. Authenticated (demo@b1.church) member flow —
// the guest flow is reCAPTCHA-gated and not exercisable headless.

const CARD_OK = "4242424242424242";
const CARD_OK2 = "5555555555554444"; // mastercard — distinct fingerprint from CARD_OK
const CARD_DECLINE = "4000000000000002"; // generic_decline at charge time
const STRIPE_CARD_FRAME = 'iframe[title="Secure card payment input frame"]';

async function fillStripeCard(page: Page, number: string, exp = "1234", cvc = "123", postal = "42424") {
  const frame = page.frameLocator(STRIPE_CARD_FRAME);
  await frame.locator('[name="cardnumber"]').waitFor({ state: "visible", timeout: 20000 });
  await frame.locator('[name="cardnumber"]').fill(number);
  await frame.locator('[name="exp-date"]').fill(exp);
  await frame.locator('[name="cvc"]').fill(cvc);
  const postalField = frame.locator('[name="postal"]');
  if (await postalField.count()) await postalField.fill(postal);
}

function captureDiagnostics(page: Page) {
  const log: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/IDBObjectStore|status of 429|Hydration/.test(m.text())) {
      log.push(`[console.error] ${m.text().slice(0, 500)}`);
    }
  });
  page.on("pageerror", (e) => {
    if (/IDBObjectStore|Hydration/.test(e.message)) return;
    log.push(`[pageerror] ${e.message.slice(0, 500)}`);
  });
  page.on("response", async (r) => {
    const u = r.url();
    if (/\/donate\/(charge|subscribe)|\/paymentmethods/.test(u)) {
      let body = "";
      try { body = JSON.stringify(await r.json()); } catch { /* non-json */ }
      log.push(`[${r.request().method()} ${r.status()}] ${u.replace(/^https?:\/\/[^/]+/, "")} -> ${body.slice(0, 300)}`);
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

// Fund-amount + payment-method entry, adaptive: inline Stripe entry when no saved
// card exists, otherwise the saved-method select (default selection is fine).
async function fillDonationDetails(page: Page, amount: string, card: string) {
  await page.locator("#donation-details").waitFor({ state: "visible", timeout: 15000 });
  await page.locator('input[name="amount"]').first().fill(amount);
  // Wait for whichever payment UI renders: the inline Stripe iframe (no saved
  // card) or the saved-method select. The Stripe iframe loads async, so a bare
  // count() races it.
  const frame = page.locator(STRIPE_CARD_FRAME);
  const select = page.locator("#payment-method-select");
  await expect(frame.or(select).first()).toBeVisible({ timeout: 20000 });
  if (await frame.count()) await fillStripeCard(page, card);
}

async function submitDonation(page: Page) {
  await page.locator('button[aria-label="save-button"]').click(); // Preview
  const donateBtn = page.locator('button[aria-label="donate-button"]');
  await donateBtn.waitFor({ state: "visible", timeout: 10000 });
  await donateBtn.click();
}

// The add menu (PaymentMethods.MenuIcon) is defined inside render, so a background
// gateway refetch can remount it and dismiss an open menu — retry until the
// CardForm iframe appears.
async function addCardViaManage(page: Page, card: string) {
  await openManageTab(page);
  await expect(async () => {
    await page.getByLabel("add-button").click();
    await page.getByLabel("add-card").click({ timeout: 2000 });
    await expect(page.locator(STRIPE_CARD_FRAME)).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 30000 });
  await fillStripeCard(page, card);
  await page.locator('button[aria-label="save-button"]').click();
}

async function deleteAllCards(page: Page) {
  page.on("dialog", (d) => d.accept());
  await openManageTab(page);
  // Stay on the live view; the component invalidates + refetches after each
  // delete. Re-navigating would restore the (now stale) persisted cache.
  for (let i = 0; i < 8; i++) {
    const count = await page.getByLabel("edit-button").count();
    if (count === 0) break;
    await page.getByLabel("edit-button").first().click();
    await page.locator('button[aria-label="delete-button"], button:has-text("Delete")').first().click();
    await expect(page.getByLabel("edit-button")).toHaveCount(count - 1, { timeout: 20000 });
  }
}

test.describe.serial("Stripe member donations (real test-mode charges)", () => {
  test("one-time donation with a new card (inline entry)", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await deleteAllCards(page); // deterministic clean slate -> inline card entry
    await openDonateTab(page);
    await fillDonationDetails(page, "5", CARD_OK);
    await submitDonation(page);

    let ok = true;
    await expect(page.getByText(/Thank you for your donation/i)).toBeVisible({ timeout: 45000 }).catch(() => { ok = false; });
    if (!ok) console.log("DIAG:\n" + diag.join("\n"));
    expect(ok, "No success Alert after one-time donation").toBe(true);
  });

  test("saved card appears on Manage tab", async ({ page }) => {
    await openManageTab(page);
    await expect(page.getByText(/\*{2,4}4242/).first()).toBeVisible({ timeout: 20000 });
  });

  test("add a second card via Manage tab (CardForm)", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await addCardViaManage(page, CARD_OK2);

    let ok = true;
    await expect(page.getByText(/added|saved/i).first()).toBeVisible({ timeout: 30000 }).catch(() => { ok = false; });
    if (!ok) console.log("DIAG:\n" + diag.join("\n"));
    // The newly added (distinct) card appears on the live view after the
    // post-save invalidate + refetch (no re-navigation -> no stale cache).
    await expect(page.getByText(/\*{2,4}4444/).first()).toBeVisible({ timeout: 30000 });
  });

  test("recurring donation with a saved card", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await openDonateTab(page);
    await page.locator("#recurring-donation-button").click();
    await page.locator("#frequency-select").waitFor({ state: "visible", timeout: 15000 });
    await fillDonationDetails(page, "10", CARD_OK);
    await submitDonation(page);

    let ok = true;
    await expect(page.getByText(/Recurring donation created|Thank you for your donation/i)).toBeVisible({ timeout: 45000 }).catch(() => { ok = false; });
    if (!ok) console.log("DIAG:\n" + diag.join("\n"));
    expect(ok, "No success Alert after recurring donation").toBe(true);
  });

  test("delete a card via Manage tab", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await openManageTab(page);
    const before = await page.getByLabel("edit-button").count();
    expect(before, "expected at least one saved card to delete").toBeGreaterThan(0);

    page.on("dialog", (d) => d.accept());
    await page.getByLabel("edit-button").first().click();
    await page.locator('button[aria-label="delete-button"], button:has-text("Delete")').first().click();

    // Live view refetches after the delete's invalidate; count drops by one.
    await expect(page.getByLabel("edit-button"), "card count should drop by one after delete")
      .toHaveCount(before - 1, { timeout: 30000 }).catch(() => { console.log("DIAG:\n" + diag.join("\n")); throw new Error("delete did not reduce card count"); });
  });
});

test.describe("Stripe guest (unauthenticated) donation", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // Backend now allows anonymous card add: PaymentMethodController /addcard no longer
  // requires au.personId to match (2026-06-30 fix — the authz hardening had broken all
  // guest card giving with a 401). The guest flow is wired end to end now:
  // /users/loadOrCreate, /people/loadOrCreate, /paymentmethods/addcard and /donate/charge
  // all tolerate an empty au. Still parked as fixme because it needs the dev server with
  // NEXT_PUBLIC_BYPASS_RECAPTCHA=true and live Stripe test keys; un-fixme to verify against
  // that env.
  test.fixme("a guest can donate with the test card", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await page.goto("/mobile/donate");
    await page.locator('input[name="firstName"]').waitFor({ state: "visible", timeout: 30000 });
    await page.locator('input[name="firstName"]').fill("Guest");
    await page.locator('input[name="lastName"]').fill("Donor");
    await page.locator('input[name="email"]').fill(`guest+${Date.now()}@example.com`);
    await page.locator('input[name="amount"]').first().fill("5");

    await page.frameLocator('iframe[title="Secure card number input frame"]').locator('[name="cardnumber"]').fill(CARD_OK);
    await page.frameLocator('iframe[title="Secure expiration date input frame"]').locator('[name="exp-date"]').fill("1234");
    await page.frameLocator('iframe[title="Secure CVC input frame"]').locator('[name="cvc"]').fill("123");

    await page.getByRole("button", { name: "Donate", exact: true }).click();

    let ok = true;
    await expect(page.getByText(/thank you/i).first()).toBeVisible({ timeout: 45000 }).catch(() => { ok = false; });
    if (!ok) console.log("DIAG:\n" + diag.join("\n"));
    expect(ok, "guest donation produced no thank-you confirmation").toBe(true);
  });
});

test.describe.serial("Stripe donation error handling", () => {
  // Runs after the member tests churn Stripe test customers/cards; a stale
  // detached-card state can occasionally surface a different (still clean) error.
  // One retry from a fresh deleteAllCards clears it; a real regression fails twice.
  test.describe.configure({ retries: 1 });

  test("a declined card surfaces an error (no stuck spinner)", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await deleteAllCards(page); // clean slate -> inline entry shows the decline card

    // Switch to the Donate tab in-page (no re-navigation) so the live 0-card
    // state holds and the inline card entry renders.
    await page.getByRole("tab", { name: /^Donate$/i }).click();
    await page.locator("#single-donation-button").waitFor({ state: "visible", timeout: 15000 });
    await fillDonationDetails(page, "5", CARD_DECLINE);
    await submitDonation(page);

    // A clean, human-readable error must appear (declined / cannot be used /
    // etc.), never raw JSON, and the modal/spinner must not hang indefinitely.
    const errAlert = page.getByRole("alert").filter({ hasText: /declin|payment|card|error|fail|cannot|could not/i }).first();
    let errored = true;
    await expect(errAlert).toBeVisible({ timeout: 45000 }).catch(() => { errored = false; });
    console.log("DIAG:\n" + diag.join("\n"));
    expect(errored, "failed charge produced no visible error (stuck spinner / silent failure)").toBe(true);
    await expect(errAlert).not.toContainText("{"); // no raw JSON leaking to donors

    // Form must remain recoverable: preview modal closed, submit button enabled.
    await expect(page.locator('button[aria-label="donate-button"]')).toHaveCount(0, { timeout: 10000 });
    await expect(page.locator('button[aria-label="save-button"]')).toBeEnabled({ timeout: 10000 });
  });

  test("a fixed error does not re-appear when re-previewing", async ({ page }) => {
    await deleteAllCards(page); // clean slate -> inline card entry
    await page.getByRole("tab", { name: /^Donate$/i }).click();
    await page.locator("#single-donation-button").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#donation-details").waitFor({ state: "visible", timeout: 15000 });
    await page.locator('input[name="amount"]').first().fill("5");

    // Enter a card but OMIT the postal code -> Stripe reports an incomplete card.
    const frame = page.frameLocator(STRIPE_CARD_FRAME);
    await frame.locator('[name="cardnumber"]').waitFor({ state: "visible", timeout: 20000 });
    await frame.locator('[name="cardnumber"]').fill(CARD_OK);
    await frame.locator('[name="exp-date"]').fill("1234");
    await frame.locator('[name="cvc"]').fill("123");

    await page.locator('button[aria-label="save-button"]').click(); // Preview
    await page.locator('button[aria-label="donate-button"]').click(); // Donate -> error toast
    const toast = page.getByText(/postal code is incomplete/i);
    await expect(toast).toBeVisible({ timeout: 20000 });

    // Let the error Snackbar auto-hide (autoHideDuration 6s).
    await expect(toast).toBeHidden({ timeout: 12000 });

    // Fix the card and re-open the preview. The stale error toast must NOT pop up
    // again just because re-previewing re-rendered the form. Check the raw DOM
    // (offset-based visibility) since the open modal makes Playwright treat the
    // toast as aria-hidden.
    await frame.locator('[name="postal"]').fill("42424");
    await page.locator('button[aria-label="save-button"]').click(); // Preview again
    await page.waitForTimeout(900);
    const staleToastShown = await page.evaluate(() => {
      const isShown = (el: Element) => !!((el as HTMLElement).offsetWidth || (el as HTMLElement).offsetHeight || el.getClientRects().length);
      return Array.from(document.querySelectorAll('[role="alert"]')).some(
        (el) => /your postal code is incomplete/i.test(el.textContent || "") && isShown(el)
      );
    });
    expect(staleToastShown, "stale error toast re-appeared after re-preview").toBe(false);
  });
});
