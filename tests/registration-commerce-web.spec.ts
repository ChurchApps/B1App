import { test, expect, request, type Page } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const VBS = "EVT00000015";
const TSHIRT = "RGS00000001";

// Gate on count fetch (post-hydration) to avoid losing input values during hydration.
async function gotoWizard(page: Page, eventId: string) {
  const countResp = page.waitForResponse((r) => r.url().includes(`/registrations/event/${eventId}/count`), { timeout: 30000 });
  await page.goto(`/register/${eventId}`);
  await countResp;
}

test.describe("Public web registration wizard (guest)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("guest reaches payment with correct total, coupon discounts it", async ({ page }) => {
    await gotoWizard(page, VBS);
    const main = page.locator("main");

    const first = main.getByLabel("First Name");
    await expect(async () => {
      await first.fill("Web");
      await expect(first).toHaveValue("Web", { timeout: 1000 });
    }).toPass({ timeout: 20000 });
    await main.getByLabel("Last Name").fill("Guest");
    await main.getByLabel("Email").fill(`webguest+${Date.now()}@example.com`);
    await page.getByTestId("primary-type").click();
    await page.getByRole("option", { name: /Chaperone/i }).click();
    await main.getByRole("button", { name: /^Continue$/i }).click();

    await expect(main.getByText("Additional Members")).toBeVisible({ timeout: 10000 });
    await main.getByRole("button", { name: /Continue/i }).click();

    await page.getByTestId("sel-add-" + TSHIRT).click();
    await expect(page.getByTestId("sel-qty-" + TSHIRT)).toHaveText("1");
    await main.getByRole("button", { name: /Continue/i }).click();

    await expect(page.getByTestId("reg-total")).toHaveText("$27.00", { timeout: 25000 });

    await page.getByTestId("reg-coupon-input").locator("input").fill("EARLYBIRD");
    await page.getByTestId("reg-coupon-apply").click();
    await expect(page.getByTestId("reg-total")).toHaveText("$24.30", { timeout: 15000 });

    await expect(page.locator('iframe[title="Secure card payment input frame"]')).toBeVisible({ timeout: 20000 });
  });
});

test.describe("Public web registration — multi-day event dates", () => {
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
    const loginBody = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    jwt = ((loginBody.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || loginBody.userChurches[0]).jwt;
    const groups = await (await ctx.get(`${API_BASE}/membership/groups`, auth())).json();
    const res = await ctx.post(`${API_BASE}/content/events`, { ...auth(), data: [{ groupId: groups[0].id, title: "Web Multi-Day Retreat", start, end, allDay: false, visibility: "public", registrationEnabled: true }] });
    expect(res.ok()).toBeTruthy();
    eventId = (await res.json())[0].id;
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await request.newContext();
    if (eventId) await ctx.delete(`${API_BASE}/content/events/${eventId}`, auth()).catch(() => { });
    await ctx.dispose();
  });

  test("an event spanning days shows its end date, not just the end time", async ({ page }) => {
    await gotoWizard(page, eventId);
    await expect(page.locator("main")).toContainText(endDate, { timeout: 15000 });
  });
});

test.describe("Public web registration — church with no online giving", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("payment step explains there is no online payment and registers to pay later", async ({ page }) => {
    // The demo church has Stripe, so the gateway lookup is stubbed empty.
    await page.route("**/donate/gateways/**", (route) => route.fulfill({ json: { gateways: [] } }));
    let posted: any = null;
    await page.route("**/registrations/register", async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({ json: { id: "REGPAYLATER", status: "pending", totalAmount: 15, amountPaid: 0, members: [] } });
    });

    await gotoWizard(page, VBS);
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

    await expect(main.getByText("Online payment is not available for this event.")).toBeVisible({ timeout: 15000 });
    const payLater = main.getByTestId("reg-pay-later");
    await expect(payLater).toBeVisible();
    await payLater.click();
    await expect(main.getByText("pending")).toBeVisible({ timeout: 15000 });
    expect(posted, "register posted").toBeTruthy();
    expect(posted?.provider).toBeUndefined();
    expect(posted?.guestInfo?.lastName).toBe("Later");
  });
});
