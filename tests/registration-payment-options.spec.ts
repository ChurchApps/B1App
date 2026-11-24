import { test, expect, type Page } from "@playwright/test";

// Per-event registration options in the member app: pay later beside online payment, a deposit on an
// attendee type (the rest paid from My Registrations), and hiding Cancel when self-cancel is off.
// Each test builds its own event as demo@b1.church (Grace, Stripe test gateway) and removes it afterwards.
test.describe.configure({ mode: "serial" });

const API = process.env.API_BASE || "http://localhost:8084";
const CHURCH = "CHU00000001";
const GROUP = "GRP00000030";
const STRIPE_CARD_FRAME = 'iframe[title="Secure card payment input frame"]';

interface Auth { auth: string; personId: string }
interface Reg { id: string; eventId: string; status: string; totalAmount: number | string; amountPaid: number | string }

async function getAuth(page: Page): Promise<Auth> {
  const reqP = page.waitForRequest((r) => r.url().includes("/content/registrations/person/") && !!r.headers()["authorization"], { timeout: 40000 });
  await page.goto("/mobile/registrations");
  const req = await reqP;
  return { auth: req.headers()["authorization"], personId: req.url().match(/person\/([^/?]+)/)?.[1] || "" };
}

const headers = (a: Auth) => ({ Authorization: a.auth, "Content-Type": "application/json" });

async function fillStripeCard(page: Page) {
  const frame = page.frameLocator(STRIPE_CARD_FRAME).first();
  await frame.locator('[name="cardnumber"]').waitFor({ state: "visible", timeout: 20000 });
  await frame.locator('[name="cardnumber"]').fill("4242424242424242");
  await frame.locator('[name="exp-date"]').fill("1234");
  await frame.locator('[name="cvc"]').fill("123");
  const postal = frame.locator('[name="postal"]');
  if (await postal.count()) await postal.fill("42424");
}

test.describe.serial("Registration payment options (pay later, deposit, self-cancel)", () => {
  let a: Auth;
  const eventIds: string[] = [];

  async function createEvent(page: Page, title: string, overrides: Record<string, unknown>, type?: Record<string, unknown>) {
    const start = new Date(Date.now() + 9 * 864e5).toISOString();
    const end = new Date(Date.now() + 9 * 864e5 + 3600e3).toISOString();
    const ev = { churchId: CHURCH, groupId: GROUP, title, description: "", start, end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 100, ...overrides };
    const id = (await (await page.request.post(API + "/content/events", { headers: headers(a), data: [ev] })).json())[0].id as string;
    eventIds.push(id);
    if (type) await page.request.post(API + "/content/registrations/types", { headers: headers(a), data: [{ eventId: id, sort: 1, active: true, ...type }] });
    return id;
  }

  async function myReg(page: Page, eventId: string): Promise<Reg | undefined> {
    const regs: Reg[] = await (await page.request.get(API + "/content/registrations/person/" + a.personId, { headers: headers(a) })).json();
    return regs.find((r) => r.eventId === eventId && r.status !== "cancelled");
  }

  // Wizard as the signed-in member: pick the type, then on to the payment step.
  async function toPayment(page: Page, eventId: string, typeName: RegExp) {
    await page.goto("/mobile/register/" + eventId);
    await page.getByTestId("primary-type").click();
    await page.getByRole("option", { name: typeName }).click();
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByRole("button", { name: /Continue/i }).click();
  }

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    a = await getAuth(page);
    expect(a.personId, "demo personId").toBeTruthy();
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    for (const id of eventIds) {
      const regs: Reg[] = await (await page.request.get(API + "/content/registrations/event/" + id, { headers: headers(a) })).json().catch(() => []);
      for (const r of Array.isArray(regs) ? regs : []) await page.request.delete(API + "/content/registrations/" + r.id, { headers: headers(a) }).catch(() => { });
      await page.request.delete(API + "/content/events/" + id, { headers: headers(a) }).catch(() => { });
    }
    await page.close();
  });

  test("pay later shows beside the card form only when the event allows it", async ({ page }) => {
    const offId = await createEvent(page, "Pay Later Off Event", {}, { name: "Camper", price: 40 });
    await toPayment(page, offId, /Camper/i);
    await expect(page.getByTestId("reg-total")).toHaveText("$40.00", { timeout: 20000 });
    await expect(page.getByTestId("reg-pay-button")).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("reg-pay-later")).toHaveCount(0);

    const onId = await createEvent(page, "Pay Later On Event", { allowPayLater: true }, { name: "Camper", price: 40 });
    await toPayment(page, onId, /Camper/i);
    await page.getByTestId("reg-pay-later").click();
    await expect(page.getByText(/Registration Confirmed|Registration Pending/i).first()).toBeVisible({ timeout: 30000 });
    const reg = await myReg(page, onId);
    expect(reg?.status).toBe("pending");
    expect(Number(reg?.amountPaid)).toBe(0);
    expect(Number(reg?.totalAmount)).toBe(40);
  });

  test("a deposit type charges the deposit now and the balance is paid from My Registrations", async ({ page }) => {
    const eventId = await createEvent(page, "Deposit Camp Event", {}, { name: "Camper", price: 200, depositAmount: 50 });
    await toPayment(page, eventId, /Camper/i);
    await expect(page.getByTestId("reg-total")).toHaveText("$200.00", { timeout: 20000 });
    await expect(page.getByTestId("reg-due-today")).toHaveText("$50.00");
    await expect(page.getByTestId("reg-balance-later")).toHaveText("$150.00");
    await fillStripeCard(page);
    await page.getByTestId("reg-pay-button").click();
    await expect(page.getByText(/Registration Confirmed/i)).toBeVisible({ timeout: 60000 });
    expect(Number((await myReg(page, eventId))?.amountPaid)).toBe(50);

    await page.goto("/mobile/registrations");
    const item = page.locator(".reg-item").filter({ hasText: "Deposit Camp Event" });
    await item.getByRole("button", { name: /Complete payment/i }).click();
    await expect(page.getByTestId("reg-total")).toHaveText("$150.00", { timeout: 20000 });
    const select = page.getByTestId("reg-payment-method-select");
    if (!(await select.count())) await fillStripeCard(page);
    await page.getByTestId("reg-pay-button").click();
    await expect.poll(async () => Number((await myReg(page, eventId))?.amountPaid), { timeout: 60000 }).toBe(200);
  });

  test("My Registrations hides Cancel when the event turns self-cancel off", async ({ page }) => {
    const eventId = await createEvent(page, "No Self Cancel Event", { allowSelfCancel: false });
    const res = await page.request.post(API + "/content/registrations/register", { headers: headers(a), data: { churchId: CHURCH, eventId, personId: a.personId, members: [{ personId: a.personId, firstName: "Demo", lastName: "User" }] } });
    expect(res.ok()).toBeTruthy();

    await page.goto("/mobile/registrations");
    const item = page.locator(".reg-item").filter({ hasText: "No Self Cancel Event" });
    await expect(item.getByText(/^Edit$/)).toBeVisible({ timeout: 20000 });
    await expect(item.getByText("Cancel Registration")).toHaveCount(0);
  });
});
