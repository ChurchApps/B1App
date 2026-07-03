import { test, expect, type Page } from "@playwright/test";

// Serial: tests share demo@b1.church's registrations + Stripe customer.
test.describe.configure({ mode: "serial" });

const API = "http://localhost:8084";
const CHURCH = "CHU00000001";
const GROUP = "GRP00000030";
const VBS = "EVT00000015";
const TSHIRT = "RGS00000001"; // $12, maxQty 5. Chaperone type RGT00000002 ($15, unlimited) is picked by visible label.

const CARD_OK = "4242424242424242";
const CARD_DECLINE = "4000000000000002";
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
    if (m.type() === "error" && !/IDBObjectStore|status of 429|Hydration/.test(m.text())) log.push(`[console.error] ${m.text().slice(0, 400)}`);
  });
  page.on("response", async (r) => {
    if (/\/registrations\/(register|.*\/pay)|\/paymentmethods|\/donate\/charge/.test(r.url())) {
      let body = "";
      try { body = JSON.stringify(await r.json()); } catch { /* non-json */ }
      log.push(`[${r.request().method()} ${r.status()}] ${r.url().replace(/^https?:\/\/[^/]+/, "")} -> ${body.slice(0, 300)}`);
    }
  });
  return log;
}

interface Auth { auth: string; personId: string }

async function getAuth(page: Page): Promise<Auth> {
  const reqP = page.waitForRequest((r) => r.url().includes("/content/registrations/person/") && !!r.headers()["authorization"], { timeout: 40000 });
  await page.goto("/mobile/registrations");
  const req = await reqP;
  const auth = req.headers()["authorization"];
  const personId = req.url().match(/person\/([^/?]+)/)?.[1] || "";
  return { auth, personId };
}

const apiGet = (page: Page, path: string, a: Auth) => page.request.get(API + path, { headers: { Authorization: a.auth } });
const apiPost = (page: Page, path: string, data: any, a: Auth) => page.request.post(API + path, { headers: { Authorization: a.auth, "Content-Type": "application/json" }, data });

async function personRegs(page: Page, a: Auth): Promise<any[]> {
  const resp = await apiGet(page, "/content/registrations/person/" + a.personId, a);
  const j = await resp.json();
  return Array.isArray(j) ? j : [];
}

async function cancelExisting(page: Page, a: Auth, eventId: string) {
  for (const r of await personRegs(page, a)) {
    if (r.eventId === eventId && r.status !== "cancelled") await apiPost(page, "/content/registrations/" + r.id + "/cancel", {}, a);
  }
}

// Deterministic payment entry: clean slate matching mobile-donate-stripe.
async function clearCards(page: Page, a: Auth) {
  const resp = await apiGet(page, "/giving/paymentmethods/personid/" + a.personId, a);
  const methods = await resp.json();
  for (const m of (Array.isArray(methods) ? methods : [])) {
    if (m.id && m.customerId) await page.request.delete(API + "/giving/paymentmethods/" + m.id + "/" + m.customerId, { headers: { Authorization: a.auth } });
  }
}

async function createEvent(page: Page, a: Auth, overrides: any): Promise<string> {
  const start = new Date(Date.now() + 7 * 864e5).toISOString();
  const end = new Date(Date.now() + 7 * 864e5 + 3600e3).toISOString();
  const ev = { churchId: CHURCH, groupId: GROUP, title: "Reg Commerce Test", description: "", start, end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 100, ...overrides };
  const resp = await apiPost(page, "/content/events", [ev], a);
  const j = await resp.json();
  return j[0].id;
}

async function pickOption(page: Page, testid: string, optionText: RegExp) {
  await page.getByTestId(testid).click();
  await page.getByRole("option", { name: optionText }).click();
}

test.describe.serial("Registration commerce (paid checkout, coupon, waitlist, edit)", () => {
  let a: Auth;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    a = await getAuth(page);
    expect(a.personId, "captured demo personId").toBeTruthy();
    await page.close();
  });

  test("free registration (no types) still works — regression", async ({ page }) => {
    const eventId = await createEvent(page, a, { title: "Free Reg Regression", capacity: 100 });
    await cancelExisting(page, a, eventId);

    await page.goto("/mobile/register/" + eventId);
    await page.getByRole("button", { name: /Continue/i }).click(); // info -> members
    await page.getByRole("button", { name: /Complete Registration/i }).click(); // members -> submit (unchanged free-path CTA)

    await expect(page.getByText(/Registration Confirmed/i)).toBeVisible({ timeout: 30000 });
    const regs = await personRegs(page, a);
    const mine = regs.find((r) => r.eventId === eventId && r.status !== "cancelled");
    expect(mine, "free registration persisted").toBeTruthy();
    expect(mine.status).toBe("confirmed");
    expect(Number(mine.totalAmount) || 0).toBe(0);
  });

  test("member paid checkout: Chaperone + 1 T-shirt = $27, Stripe card -> confirmed", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await cancelExisting(page, a, VBS);
    await clearCards(page, a);

    await page.goto("/mobile/register/" + VBS);
    await pickOption(page, "primary-type", /Chaperone/i);
    await page.getByRole("button", { name: /Continue/i }).click(); // info -> members
    await page.getByRole("button", { name: /Continue/i }).click(); // members -> selections
    await page.getByTestId("sel-add-" + TSHIRT).click(); // T-shirt qty 1
    await expect(page.getByTestId("sel-qty-" + TSHIRT)).toHaveText("1");
    await page.getByRole("button", { name: /Continue/i }).click(); // selections -> payment

    await expect(page.getByTestId("reg-total")).toHaveText("$27.00", { timeout: 20000 });
    await fillStripeCard(page, CARD_OK);
    await page.getByTestId("reg-pay-button").click();

    let ok = true;
    await expect(page.getByText(/Registration Confirmed/i)).toBeVisible({ timeout: 60000 }).catch(() => { ok = false; });
    if (!ok) console.log("DIAG:\n" + diag.join("\n"));
    expect(ok, "confirmed after paid checkout").toBe(true);

    const regs = await personRegs(page, a);
    const mine = regs.find((r) => r.eventId === VBS && r.status !== "cancelled");
    expect(mine, "paid registration exists").toBeTruthy();
    expect(mine.status).toBe("confirmed");
    expect(Number(mine.totalAmount)).toBeCloseTo(27, 2);
    expect(Number(mine.amountPaid)).toBeCloseTo(27, 2);
    const pays = await (await apiGet(page, "/content/registrations/payments/" + mine.id, a)).json();
    expect(Array.isArray(pays) && pays.length > 0, "payment row recorded").toBe(true);
    expect(Number(pays[0].amount)).toBeCloseTo(27, 2);
  });

  test("coupon EARLYBIRD applies 10% off -> charged $24.30", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await cancelExisting(page, a, VBS);
    await clearCards(page, a);

    await page.goto("/mobile/register/" + VBS);
    await pickOption(page, "primary-type", /Chaperone/i);
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByTestId("sel-add-" + TSHIRT).click();
    await page.getByRole("button", { name: /Continue/i }).click();

    await expect(page.getByTestId("reg-total")).toHaveText("$27.00", { timeout: 20000 });
    await page.getByTestId("reg-coupon-input").locator("input").fill("EARLYBIRD");
    await page.getByTestId("reg-coupon-apply").click();
    await expect(page.getByTestId("reg-total")).toHaveText("$24.30", { timeout: 15000 });

    await fillStripeCard(page, CARD_OK);
    await page.getByTestId("reg-pay-button").click();

    let ok = true;
    await expect(page.getByText(/Registration Confirmed/i)).toBeVisible({ timeout: 60000 }).catch(() => { ok = false; });
    if (!ok) console.log("DIAG:\n" + diag.join("\n"));
    expect(ok, "confirmed after coupon checkout").toBe(true);

    const mine = (await personRegs(page, a)).find((r) => r.eventId === VBS && r.status !== "cancelled");
    expect(Number(mine.totalAmount)).toBeCloseTo(24.3, 2);
    expect(Number(mine.amountPaid)).toBeCloseTo(24.3, 2);
  });

  test("edit post-submission: change T-shirt quantity, persisted", async ({ page }) => {
    await page.goto("/mobile/registrations");
    const mineBefore = (await personRegs(page, a)).find((r) => r.eventId === VBS && r.status !== "cancelled");
    expect(mineBefore, "an active VBS registration to edit").toBeTruthy();

    await page.reload();
    await page.getByRole("button", { name: /^Edit$/ }).first().click();
    await page.getByTestId("edit-sel-add-" + TSHIRT).click(); // 1 -> 2
    await expect(page.getByTestId("edit-sel-qty-" + TSHIRT)).toHaveText("2");
    await page.getByTestId("edit-save").click();

    await expect.poll(async () => {
      const full = await (await apiGet(page, "/content/registrations/" + mineBefore.id, a)).json();
      const choices = full.selectionChoices || [];
      return choices.filter((c: any) => c.selectionId === TSHIRT).reduce((s: number, c: any) => s + Number(c.quantity), 0);
    }, { timeout: 15000 }).toBe(2);
  });

  test("declined card surfaces an error and creates no registration", async ({ page }) => {
    const diag = captureDiagnostics(page);
    await cancelExisting(page, a, VBS);
    await clearCards(page, a);

    await page.goto("/mobile/register/" + VBS);
    await pickOption(page, "primary-type", /Chaperone/i);
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByTestId("sel-add-" + TSHIRT).click();
    await page.getByRole("button", { name: /Continue/i }).click();

    await expect(page.getByTestId("reg-total")).toHaveText("$27.00", { timeout: 20000 });
    await fillStripeCard(page, CARD_DECLINE);
    await page.getByTestId("reg-pay-button").click();

    const err = page.getByRole("alert").filter({ hasText: /declin|card|payment|fail|cannot|could not/i }).first();
    let errored = true;
    await expect(err).toBeVisible({ timeout: 45000 }).catch(() => { errored = false; });
    if (!errored) console.log("DIAG:\n" + diag.join("\n"));
    expect(errored, "declined charge surfaced an error").toBe(true);

    await expect(page.getByTestId("reg-pay-button")).toBeVisible();

    const active = (await personRegs(page, a)).filter((r) => r.eventId === VBS && r.status !== "cancelled");
    expect(active.length, "no registration created after decline").toBe(0);
  });

  test("waitlist: full event + waitlistEnabled -> waitlisted, visible on My Registrations", async ({ page }) => {
    const eventId = await createEvent(page, a, { title: "Waitlist Test", capacity: 1, waitlistEnabled: true });
    await cancelExisting(page, a, eventId);

    const guestResp = await page.request.post(API + "/content/registrations/register", {
      headers: { "Content-Type": "application/json" },
      data: { churchId: CHURCH, eventId, guestInfo: { firstName: "Cap", lastName: "Filler", email: `filler+${Date.now()}@example.com` } }
    });
    expect((await guestResp.json()).status).toBe("confirmed");

    const meResp = await apiPost(page, "/content/registrations/register", { churchId: CHURCH, eventId, personId: a.personId }, a);
    expect((await meResp.json()).status).toBe("waitlisted");

    await page.goto("/mobile/registrations");
    const card = page.locator("div").filter({ hasText: "Waitlist Test" }).first();
    await expect(card.getByText(/waitlisted/i).first()).toBeVisible({ timeout: 20000 });
  });
});
