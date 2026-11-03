import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { getApi, apiCall, doingUrl } from "./helpers/api";

// Issue #1449: member app rough edges found while recording training videos.
// Tests share demo@b1.church's registrations and Emma's check-ins, so run in order.
test.describe.configure({ mode: "default" });

const API = process.env.API_BASE || "http://localhost:8084";
const CHURCH = "CHU00000001";
const VBS = "EVT00000015";
const EMMA = "PER00000085";
const SERVICE = "SER00000001";

interface Auth { auth: string; personId: string }

async function getAuth(page: Page): Promise<Auth> {
  const reqP = page.waitForRequest((r) => r.url().includes("/content/registrations/person/") && !!r.headers()["authorization"], { timeout: 40000 });
  await page.goto("/mobile/registrations");
  const req = await reqP;
  return { auth: req.headers()["authorization"], personId: req.url().match(/person\/([^/?]+)/)?.[1] || "" };
}

const apiPost = (page: Page, path: string, data: any, a: Auth) => page.request.post(API + path, { headers: { Authorization: a.auth, "Content-Type": "application/json" }, data });

async function personRegs(page: Page, a: Auth): Promise<any[]> {
  const j = await (await page.request.get(API + "/content/registrations/person/" + a.personId, { headers: { Authorization: a.auth } })).json();
  return Array.isArray(j) ? j : [];
}

async function cancelExisting(page: Page, a: Auth, eventId: string) {
  for (const r of await personRegs(page, a)) {
    if (r.eventId === eventId && r.status !== "cancelled") await apiPost(page, "/content/registrations/" + r.id + "/cancel", {}, a);
  }
}

async function pickOption(page: Page, testid: string, optionText: RegExp) {
  await page.getByTestId(testid).click();
  await page.getByRole("option", { name: optionText }).click();
}

// VBS as a Chaperone ($15), no selections, through to the payment step.
async function goToVbsPayment(page: Page) {
  await page.goto("/mobile/register/" + VBS);
  await pickOption(page, "primary-type", /Chaperone/i);
  await page.getByRole("button", { name: /Continue/i }).click(); // info -> members
  await page.getByRole("button", { name: /Continue/i }).click(); // members -> selections
  await page.getByRole("button", { name: /Continue/i }).click(); // selections -> payment
  await expect(page.getByTestId("reg-total")).toHaveText("$15.00", { timeout: 20000 });
}

const attendanceHeaders = async (request: APIRequestContext) => {
  const res = await request.post(API + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" } });
  const church = (await res.json()).userChurches.find((c: any) => c.church.id === CHURCH);
  return { Authorization: "Bearer " + church.apis.find((x: any) => x.keyName === "AttendanceApi").jwt };
};

const clearEmmasVisits = async (request: APIRequestContext) => {
  const headers = await attendanceHeaders(request);
  const today = new Date().toLocaleDateString("en-CA");
  const visits = await (await request.get(API + "/attendance/visits?personId=" + EMMA, { headers })).json();
  for (const v of Array.isArray(visits) ? visits : []) {
    if (v.id && String(v.visitDate).slice(0, 10) === today) await request.delete(API + "/attendance/visits/" + v.id, { headers });
  }
};

test.describe("Issue 1449 member app", () => {
  let a: Auth;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    a = await getAuth(page);
    expect(a.personId, "captured demo personId").toBeTruthy();
    await page.close();
  });

  test("check-in into a room short on volunteers names the room instead of blaming the connection", async ({ page, request }) => {
    await clearEmmasVisits(request);
    // Elementary (K-2) seeds volunteerRatio 5 / minVolunteers 1 with no volunteers checked in, so the Api answers 409 ratio.
    const checkin = page.waitForResponse((r) => r.url().includes("/attendance/visits/checkin") && r.request().method() === "POST");
    await page.goto("/mobile/checkin");
    await page.getByTestId("select-service-" + SERVICE + "-button").click({ timeout: 30000 });
    await page.getByTestId("select-member-" + EMMA).click({ timeout: 30000 });
    await page.getByTestId("service-time-SST00000001").click();
    await page.getByText("Elementary (K-2)", { exact: true }).click({ timeout: 30000 });
    await page.getByTestId("checkin-submit-button").click({ timeout: 30000 });
    const resp = await checkin;
    expect(resp.status()).toBe(409);
    expect((await resp.json()).error).toBe("ratio");
    const main = page.locator("main");
    await expect(main).toContainText("Elementary (K-2) doesn't have enough volunteers", { timeout: 15000 });
    await expect(main).not.toContainText("check your connection");
    await clearEmmasVisits(request);
  });

  test("a signed-in registration saves and lists the member's own name", async ({ page }) => {
    const start = new Date(Date.now() + 7 * 864e5).toISOString();
    const end = new Date(Date.now() + 7 * 864e5 + 3600e3).toISOString();
    const ev = await (await apiPost(page, "/content/events", [{ churchId: CHURCH, groupId: "GRP00000030", title: "Name Check " + Date.now(), description: "", start, end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 100 }], a)).json();
    const eventId = ev[0].id;
    try {
      await page.goto("/mobile/register/" + eventId);
      await page.getByRole("button", { name: /Continue/i }).click(); // info -> members
      await page.getByRole("button", { name: /Complete Registration/i }).click();
      await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 30000 });
      await expect(page.locator("main")).toContainText("Demo User");
      const mine = (await personRegs(page, a)).find((r) => r.eventId === eventId && r.status !== "cancelled");
      const full = await (await page.request.get(API + "/content/registrations/" + mine.id, { headers: { Authorization: a.auth } })).json();
      const me = (full.members || []).find((m: any) => m.personId === a.personId);
      expect(me?.firstName).toBe("Demo");
      expect(me?.lastName).toBe("User");
    } finally {
      await page.request.delete(API + "/content/events/" + eventId, { headers: { Authorization: a.auth } });
    }
  });

  test("Register and Pay Later shows Pending with the balance due, not Registration Confirmed", async ({ page }) => {
    await cancelExisting(page, a, VBS);
    // The demo church has Stripe, so stand in for a church with no online giving: empty gateway
    // lookup, and the pending registration the Api returns for an unpaid total.
    await page.route("**/donate/gateways/**", (route) => route.fulfill({ json: { gateways: [] } }));
    await page.route("**/registrations/register", (route) => route.fulfill({ json: { id: "REGPAYLATER", eventId: VBS, status: "pending", totalAmount: 15, amountPaid: 0, members: [{ firstName: "Demo", lastName: "User" }] } }));
    await goToVbsPayment(page);
    await page.getByTestId("reg-pay-later").click();
    const main = page.locator("main");
    await expect(main.getByRole("heading", { level: 2, name: "Registration Pending" })).toBeVisible({ timeout: 30000 });
    await expect(main).not.toContainText("Registration Confirmed");
    await expect(main.getByText("Pending", { exact: true })).toBeVisible();
    await expect(main).toContainText("Balance due $15.00 of $15.00");
  });

  test("an expired discount code says it has expired instead of a raw key", async ({ page }) => {
    await cancelExisting(page, a, VBS);
    const code = "OLD" + Date.now();
    const saved = await (await apiPost(page, "/content/registrations/coupons", [{ eventId: VBS, code, discountType: "percent", value: 10, endDate: "2020-01-01", active: true }], a)).json();
    try {
      await goToVbsPayment(page);
      await page.getByTestId("reg-coupon-input").locator("input").fill(code);
      await page.getByTestId("reg-coupon-apply").click();
      await expect(page.getByText("This code has expired.")).toBeVisible({ timeout: 15000 });
      await expect(page.locator("main")).not.toContainText("registration.coupon");
    } finally {
      if (saved?.[0]?.id) await page.request.delete(API + "/content/registrations/coupons/" + saved[0].id, { headers: { Authorization: a.auth } });
    }
  });

  test("a plan with one serving team says 1 team", async ({ page }) => {
    const demo = await getApi("demo");
    let planId = "";
    try {
      const plan = await (await apiCall(demo, "post", doingUrl("/plans"), [{ ministryId: "GRP0000000a", planTypeId: "PLT00000001", name: "One Team " + Date.now(), serviceDate: new Date().toISOString().slice(0, 10), notes: "", serviceOrder: true }])).json();
      planId = plan[0].id;
      const pos = await (await apiCall(demo, "post", doingUrl("/positions"), [{ planId, categoryName: "Greeters", name: "Door Greeter", count: 1, groupId: "GRP0000000b" }])).json();
      await apiCall(demo, "post", doingUrl("/assignments"), [{ positionId: pos[0].id, personId: a.personId, status: "Accepted" }]);

      await page.goto("/mobile/plans/" + planId);
      await expect(page.getByText(/1 serving · 1 team$/)).toBeVisible({ timeout: 30000 });
    } finally {
      if (planId) await apiCall(demo, "delete", doingUrl("/plans/" + planId));
      await demo.request.dispose();
    }
  });
});
