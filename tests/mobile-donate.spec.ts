import { test, expect, request } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile donate", () => {
  test("donate page loads for authenticated user", async ({ page }) => {
    await page.goto("/mobile/donate");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page).toHaveURL(/\/mobile\/donate/);
  });

  test("legacy /mobile/donation slug routes to donate", async ({ page }) => {
    await page.goto("/mobile/donation");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("authenticated user sees all four giving tabs", async ({ page }) => {
    await page.goto("/mobile/donate");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.getByRole("tab", { name: /Overview/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("tab", { name: /^Donate$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Manage/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /History/i })).toBeVisible();
  });

  test("can switch between tabs without crashing", async ({ page }) => {
    await page.goto("/mobile/donate");
    const donateTab = page.getByRole("tab", { name: /^Donate$/i });
    await donateTab.waitFor({ state: "visible", timeout: 15000 });
    await donateTab.click();
    await expect(donateTab).toHaveAttribute("aria-selected", "true");
    const historyTab = page.getByRole("tab", { name: /History/i });
    await historyTab.click();
    await expect(historyTab).toHaveAttribute("aria-selected", "true");
  });

  test("History tab shows seeded demo-user donations", async ({ page }) => {
    await page.goto("/mobile/donate");
    const historyTab = page.getByRole("tab", { name: /History/i });
    await historyTab.waitFor({ state: "visible", timeout: 15000 });
    await historyTab.click();
    await expect(page.locator("main")).toContainText(/General Fund/i, { timeout: 15000 });
  });

  test("Overview tab shows year-to-date total and a Repeat affordance", async ({ page }) => {
    await page.goto("/mobile/donate");
    const overviewTab = page.getByRole("tab", { name: /Overview/i });
    await overviewTab.waitFor({ state: "visible", timeout: 15000 });
    await overviewTab.click();
    const main = page.locator("main");
    await expect(main).toContainText(/Total this year/i, { timeout: 30000 });
    await expect(main.getByRole("button", { name: /Repeat/i })).toBeVisible();
  });
});

// Mixed-currency giving: each gift keeps its own currency in the history list, but the Year-to-Date and
// period totals are converted into the church currency (USD on Grace) with the Api's own exchange rates.
// The expected figures are rebuilt from the Api's gifts + read-only rate table, so they follow the live rate.
test.describe.serial("Mobile donate mixed-currency totals", () => {
  const MAIN_API = process.env.API_BASE || "http://localhost:8084";
  const DEMO_PERSON_ID = "PER00000082";
  const CONVERTED_NOTE = "Converted at current exchange rates";
  let batchId: string;
  let expectedYtd: string;
  let expectedAllTime: string;
  let rawYtd: string;

  const apiAuth = async (ctx: Awaited<ReturnType<typeof request.newContext>>) => {
    const res = await ctx.post(`${MAIN_API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
    const body = await res.json();
    const uc = (body.userChurches || []).find((c: any) => c.church?.id === "CHU00000001");
    return { headers: { Authorization: `Bearer ${uc.jwt}` } };
  };

  const usd = (value: number) => "$ " + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const auth = await apiAuth(ctx);
    // Local calendar date, so the gift lands in the same year the page's year-to-date filter uses.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const batchRes = await ctx.post(`${MAIN_API}/giving/donationbatches`, { ...auth, data: [{ name: "Zacchaeus Euro Gift", batchDate: today }] });
    batchId = (await batchRes.json())[0].id;
    const donationRes = await ctx.post(`${MAIN_API}/giving/donations`, {
      ...auth,
      data: [{ batchId, personId: DEMO_PERSON_ID, donationDate: today, amount: 100, currency: "eur", method: "Card", status: "complete" }]
    });
    const donationId = (await donationRes.json())[0].id;
    await ctx.post(`${MAIN_API}/giving/funddonations`, { ...auth, data: [{ donationId, fundId: "FUN00000001", amount: 100 }] });

    const table = await (await ctx.get(`${MAIN_API}/giving/donations/exchange-rates`, auth)).json();
    expect(table.base).toBe("usd");
    expect(table.rates?.EUR, "Api could not load EUR rates from frankfurter").toBeGreaterThan(0);

    const gifts: any[] = await (await ctx.get(`${MAIN_API}/giving/donations/my`, auth)).json();
    const year = new Date().getFullYear();
    const amountOf = (d: any) => Number(d.fund?.amount ?? d.amount ?? 0);
    const converted = (d: any) => ((d.currency || "usd").toLowerCase() === "usd" ? amountOf(d) : Number((amountOf(d) / table.rates[d.currency.toUpperCase()]).toFixed(2)));
    const thisYear = gifts.filter((d) => new Date(d.donationDate).getFullYear() === year);
    expectedYtd = usd(thisYear.reduce((sum, d) => sum + converted(d), 0));
    rawYtd = usd(thisYear.reduce((sum, d) => sum + amountOf(d), 0));
    expectedAllTime = usd(gifts.reduce((sum, d) => sum + converted(d), 0));
    expect(expectedYtd).not.toBe(rawYtd);
    await ctx.dispose();
  });

  test.afterAll(async () => {
    if (!batchId) return;
    const ctx = await request.newContext();
    const auth = await apiAuth(ctx);
    await ctx.delete(`${MAIN_API}/giving/donationbatches/${batchId}`, auth);
    await ctx.dispose();
  });

  test("Overview year-to-date total converts the euro gift and says so", async ({ page }) => {
    await page.goto("/mobile/donate");
    const overviewTab = page.getByRole("tab", { name: /Overview/i });
    await overviewTab.waitFor({ state: "visible", timeout: 15000 });
    await overviewTab.click();
    await expect(page.getByTestId("giving-ytd-total")).toHaveText(expectedYtd, { timeout: 30000 });
    await expect(page.getByTestId("giving-ytd-converted-note")).toHaveText(CONVERTED_NOTE);
  });

  test("History period total is converted while the gift row stays in euros", async ({ page }) => {
    await page.goto("/mobile/donate");
    const historyTab = page.getByRole("tab", { name: /History/i });
    await historyTab.waitFor({ state: "visible", timeout: 15000 });
    await historyTab.click();
    await expect(page.getByTestId("giving-period-total")).toHaveText(expectedAllTime, { timeout: 30000 });
    await expect(page.getByTestId("giving-period-converted-note")).toHaveText(CONVERTED_NOTE);
    await expect(page.locator("main")).toContainText("€ 100.00");
  });
});

// Country receipt formats: the donor-facing statement mirrors the B1Admin legal block,
// driven by the church's statement-format settings.
test.describe.serial("Mobile donate statement receipt formats", () => {
  const MAIN_API = process.env.API_BASE || "http://localhost:8084";
  const REG_NUMBER = "119288945RR0001";

  // /membership/settings inserts a new row when no id is sent, so reuse existing ids
  // or every write leaves a duplicate key behind.
  const setFormat = async (format: string) => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${MAIN_API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
    const body = await res.json();
    const uc = (body.userChurches || []).find((c: any) => c.church?.id === "CHU00000001");
    const auth = { headers: { Authorization: `Bearer ${uc.jwt}` } };
    const existing: any[] = await (await ctx.get(`${MAIN_API}/membership/settings`, auth)).json();
    const values: Record<string, string> = {
      statementFormat: format,
      statementRegistrationNumber: REG_NUMBER,
      statementSignatory: "Pastor Grace Miller",
      statementCityOfIssue: "Toronto"
    };
    const settings = Object.keys(values).map((keyName) => {
      const found = existing.find((s) => s.keyName === keyName);
      return { ...(found || { churchId: "CHU00000001", public: 1, keyName }), value: values[keyName] };
    });
    const post = await ctx.post(`${MAIN_API}/membership/settings`, { ...auth, data: settings });
    expect(post.ok()).toBeTruthy();
    await ctx.dispose();
  };

  test.beforeEach(async ({ page }) => {
    // The print page auto-prints then routes back; keep it on screen to assert.
    await page.addInitScript(() => {
      window.print = () => {};
      window.history.back = () => {};
      window.history.go = () => {};
    });
  });

  test.afterAll(async () => {
    await setFormat("");
  });

  test("Canada format adds the CRA receipt block to the donor statement", async ({ page }) => {
    await setFormat("canada");
    await page.goto("/mobile/donate/print");
    const block = page.locator('[data-testid="statement-legal-block"]');
    await expect(block).toBeVisible({ timeout: 20000 });
    await expect(block).toContainText("Official Receipt for Income Tax Purposes");
    await expect(block).toContainText("Charity registration number: " + REG_NUMBER);
    await expect(block).toContainText("Place of issue: Toronto");
    await expect(block).toContainText("Eligible amount of gift for income tax purposes");
    await expect(block).toContainText("Canada Revenue Agency: canada.ca/charities-giving");
  });

  test("standard format prints no receipt block", async ({ page }) => {
    await setFormat("");
    await page.goto("/mobile/donate/print");
    await expect(page.getByText("Statement Summary:")).toBeVisible({ timeout: 20000 });
    await expect(page.locator('[data-testid="statement-legal-block"]')).toHaveCount(0);
  });
});

test.describe("Public donate page links", () => {
  test("login button and help link point at current destinations", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/donate");
    const login = page.getByTestId("donate-login-button");
    await expect(login).toBeVisible({ timeout: 30000 });
    await expect(page.locator('a[href="/mobile/login?returnUrl=/mobile/donate"]')).toBeVisible();
    await expect(page.getByTestId("donate-instructions-link")).toHaveAttribute("href", /b1-church\/giving\/making-donations/);
  });
});
