import { test, expect, request, type Page } from "@playwright/test";

// Issue #1417: multi-day events show only the start date, and a paid registration at a church
// with no online giving shows no card form, no button and no message.

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const VBS = "EVT00000015";

const start = new Date();
start.setDate(start.getDate() + 30);
start.setHours(18, 0, 0, 0);
const end = new Date(start);
end.setDate(end.getDate() + 2);
end.setHours(12, 0, 0, 0);
const endDate = end.toLocaleDateString("en-US", { dateStyle: "medium" });

let jwt = "";
let eventId = "";
const auth = () => ({ headers: { Authorization: "Bearer " + jwt } });

test.beforeAll(async () => {
  const ctx = await request.newContext();
  const login = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
  jwt = ((login.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || login.userChurches[0]).jwt;
  const groups = await (await ctx.get(`${API_BASE}/membership/groups`, auth())).json();
  const res = await ctx.post(`${API_BASE}/content/events`, { ...auth(), data: [{ groupId: groups[0].id, title: "Issue 1417 Retreat", start, end, allDay: false, visibility: "public", registrationEnabled: true }] });
  eventId = (await res.json())[0].id;
  await ctx.dispose();
});

test.afterAll(async () => {
  const ctx = await request.newContext();
  if (eventId) await ctx.delete(`${API_BASE}/content/events/${eventId}`, auth()).catch(() => { });
  await ctx.dispose();
});

test("multi-day event shows its end date on /register", async ({ page }) => {
  const countResp = page.waitForResponse((r) => r.url().includes(`/registrations/event/${eventId}/count`), { timeout: 30000 });
  await page.goto(`/register/${eventId}`);
  await countResp;
  await expect(page.locator("main")).toContainText(endDate, { timeout: 15000 });
});

test("multi-day event shows its end date on /mobile/register", async ({ page }) => {
  await page.goto(`/mobile/register/${eventId}`);
  await expect(page.getByText("Issue 1417 Retreat").first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator("body")).toContainText(endDate);
});

async function guestToPayment(page: Page) {
  const countResp = page.waitForResponse((r) => r.url().includes(`/registrations/event/${VBS}/count`), { timeout: 30000 });
  await page.goto(`/register/${VBS}`);
  await countResp;
  const main = page.locator("main");
  const first = main.getByLabel("First Name");
  await expect(async () => {
    await first.fill("Pay");
    await expect(first).toHaveValue("Pay", { timeout: 1000 });
  }).toPass({ timeout: 20000 });
  await main.getByLabel("Last Name").fill("Later");
  await main.getByLabel("Email").fill(`paylater+${Date.now()}@example.com`);
  await page.getByTestId("primary-type").click();
  await page.getByRole("option", { name: /Chaperone/i }).click();
  await main.getByRole("button", { name: /^Continue$/i }).click();
  await expect(main.getByText("Additional Members")).toBeVisible({ timeout: 10000 });
  await main.getByRole("button", { name: /Continue/i }).click();
  await main.getByRole("button", { name: /Continue/i }).click();
  await expect(page.getByTestId("reg-total")).toBeVisible({ timeout: 25000 });
}

test.describe("church with no online giving", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("paid registration explains there is no online payment and can register to pay later", async ({ page }) => {
    await page.route("**/donate/gateways/**", (route) => route.fulfill({ json: { gateways: [] } }));
    let posted: any = null;
    await page.route("**/registrations/register", async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({ json: { id: "REG1417", status: "pending", totalAmount: 15, amountPaid: 0, members: [] } });
    });
    await guestToPayment(page);
    const main = page.locator("main");
    await expect(main.getByText("Online payment is not available for this event.")).toBeVisible({ timeout: 15000 });
    await main.getByTestId("reg-pay-later").click();
    await expect(main.getByText("pending")).toBeVisible({ timeout: 15000 });
    expect(posted?.provider).toBeUndefined();
    expect(posted?.guestInfo?.lastName).toBe("Later");
  });
});
