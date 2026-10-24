import { test, expect, request, type APIRequestContext } from "@playwright/test";

// Issue #1362: a church that records gifts but has no online payment gateway hid the member's
// giving history and Print Statement, and the printed statement's header overlapped on a phone.
// Lessons.church (CHU00000099) has no gateway; its admin gets one recorded check gift here.
test.describe.configure({ mode: "default" });
test.use({ storageState: { cookies: [], origins: [] }, baseURL: "http://lessonschurch.localtest.me:3301" });

const API = process.env.API_BASE || "http://localhost:8084";
const EMAIL = "lessons-admin@demo.churchapps.org";
const PERSON = "PER00000099";

let ctx: APIRequestContext;
let headers: Record<string, string>;
const created: { fund?: string; batch?: string; donation?: string } = {};

test.beforeAll(async () => {
  ctx = await request.newContext();
  const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: EMAIL, password: "password" } })).json();
  const uc = login.userChurches.find((c: any) => c.church.id === "CHU00000099");
  headers = { Authorization: `Bearer ${uc.jwt}` };
  const configured = await (await ctx.get(`${API}/giving/gateways/configured/CHU00000099`)).json();
  expect(configured.configured).toBe(false);

  const [fund] = await (await ctx.post(`${API}/giving/funds`, { headers, data: [{ name: "E2E General Fund", taxDeductible: true }] })).json();
  created.fund = fund.id;
  const [batch] = await (await ctx.post(`${API}/giving/donationbatches`, { headers, data: [{ name: "E2E Check Batch", batchDate: new Date() }] })).json();
  created.batch = batch.id;
  const [donation] = await (await ctx.post(`${API}/giving/donations`, {
    headers,
    data: [{ batchId: batch.id, personId: PERSON, donationDate: new Date(), amount: 75, method: "Check", methodDetails: "1001" }]
  })).json();
  created.donation = donation.id;
  const fd = await ctx.post(`${API}/giving/funddonations`, { headers, data: [{ donationId: donation.id, fundId: fund.id, amount: 75 }] });
  expect(fd.ok()).toBeTruthy();
});

test.afterAll(async () => {
  if (created.donation) await ctx.delete(`${API}/giving/donations/${created.donation}`, { headers });
  if (created.batch) await ctx.delete(`${API}/giving/donationbatches/${created.batch}`, { headers });
  if (created.fund) await ctx.delete(`${API}/giving/funds/${created.fund}`, { headers });
  await ctx.dispose();
});

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/mobile/login");
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill("password");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });
}

test("member sees recorded gifts and Print Statement without online giving", async ({ page }) => {
  await signIn(page);
  await page.goto("/mobile/donate");
  const main = page.locator("main");
  await expect(main.getByTestId("giving-ytd-total")).toContainText(/\$\s?75\.00/, { timeout: 30000 });
  await expect(main.getByRole("button", { name: "Print Statement" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Give", exact: true })).toHaveCount(0);
});

test("statement header does not overlap at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => { window.print = () => {}; window.history.back = () => {}; });
  await signIn(page);
  await page.goto("/mobile/donate/print");
  const email = page.getByText(EMAIL, { exact: true });
  const churchName = page.getByRole("heading", { name: "Lessons.church Free Curriculum" });
  await expect(email).toBeVisible({ timeout: 30000 });
  await expect(churchName).toBeVisible();
  const fits = await email.evaluate((el) => el.scrollWidth <= el.clientWidth);
  expect(fits, "email overflows its column").toBe(true);
});
