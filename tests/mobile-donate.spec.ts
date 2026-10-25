import { test, expect, request, type APIRequestContext, type Page } from "@playwright/test";
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

  test("authenticated user sees the giving plate with a link to every former tab", async ({ page }) => {
    await page.goto("/mobile/donate");
    await expect(mobileLogoutButton(page)).toBeVisible();
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Giving", level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(main.getByRole("button", { name: /^Give$/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /All history/i })).toBeVisible();
    await expect(main.getByRole("link", { name: /^Manage$/ }).first()).toBeVisible();
    await expect(main.getByRole("heading", { name: /Recent Activity/i })).toBeVisible();
  });

  test("can open the give and history slices without crashing", async ({ page }) => {
    await page.goto("/mobile/donate");
    const give = page.locator("main").getByRole("button", { name: /^Give$/ });
    await give.waitFor({ state: "visible", timeout: 15000 });
    await give.click();
    await expect(page).toHaveURL(/view=give/);
    await page.getByRole("link", { name: /Back to Giving/i }).click();
    await page.getByRole("link", { name: /All history/i }).click();
    await expect(page).toHaveURL(/view=history/);
    await expect(page.getByRole("group", { name: "Years" })).toBeVisible({ timeout: 15000 });
  });

  test("History slice shows seeded demo-user donations", async ({ page }) => {
    await page.goto("/mobile/donate?view=history");
    const allYears = page.getByRole("group", { name: "Years" }).getByRole("button", { name: "All", exact: true });
    await allYears.waitFor({ state: "visible", timeout: 15000 });
    await allYears.click();
    await expect(page.locator("main")).toContainText(/General Fund/i, { timeout: 15000 });
  });

  test("giving plate shows year-to-date total and a Repeat affordance", async ({ page }) => {
    await page.goto("/mobile/donate");
    const main = page.locator("main");
    await expect(main).toContainText(/Total this year/i, { timeout: 30000 });
    await expect(main.getByRole("button", { name: /Repeat/i })).toBeVisible();
  });
});

// Issue #1315: B1Admin > Settings > Giving limits which years members see and can print, and adds a giving note.
test.describe.serial("Mobile donate member giving settings", () => {
  const MAIN_API = process.env.API_BASE || "http://localhost:8084";
  const APP = process.env.BASE_URL || "http://grace.localtest.me:3301";
  const NOTE = "Refunds are handled by the church office.";
  const year = new Date().getFullYear();

  const saveSettings = async (values: Record<string, string>) => {
    const ctx = await request.newContext();
    const login = await (await ctx.post(`${MAIN_API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = (login.userChurches || []).find((c: any) => c.church?.id === "CHU00000001");
    const headers = { Authorization: `Bearer ${uc.jwt}` };
    const all = await (await ctx.get(`${MAIN_API}/membership/settings`, { headers })).json();
    const rows = Object.entries(values).map(([keyName, value]) => ({ ...((all as any[]).find(s => s.keyName === keyName) || { churchId: "CHU00000001", keyName }), public: 1, value }));
    const res = await ctx.post(`${MAIN_API}/membership/settings`, { headers, data: rows });
    if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
    await ctx.post(`${APP}/api/revalidate/grace`);
    await ctx.dispose();
  };

  test.afterAll(async () => { await saveSettings({ memberGivingYears: "", givingNote: "" }); });

  test("shows the church's giving note on the giving page and history", async ({ page }) => {
    await saveSettings({ memberGivingYears: "", givingNote: NOTE });
    await page.goto("/mobile/donate");
    await expect(page.getByTestId("giving-note")).toHaveText(NOTE, { timeout: 30000 });
    await page.goto("/mobile/donate?view=history");
    await expect(page.getByTestId("giving-note")).toHaveText(NOTE, { timeout: 30000 });
  });

  test("hides history, totals and statements when the church turns them off", async ({ page }) => {
    await saveSettings({ memberGivingYears: "off", givingNote: "" });
    await page.goto("/mobile/donate");
    const main = page.locator("main");
    await expect(main.getByRole("button", { name: /^Give$/ })).toBeVisible({ timeout: 30000 });
    await expect(main.getByRole("link", { name: /All history/i })).toHaveCount(0);
    await expect(main.getByRole("heading", { name: /Recent Activity/i })).toHaveCount(0);
    await expect(main.getByRole("button", { name: /Print Statement/i })).toHaveCount(0);
  });

  test("stops at the year the church allows, for viewing and printing", async ({ page }) => {
    await saveSettings({ memberGivingYears: String(year - 1), givingNote: "" });
    await page.goto("/mobile/donate?view=history");
    const years = page.getByRole("group", { name: "Years" });
    await expect(years.getByRole("button", { name: String(year - 1), exact: true })).toBeVisible({ timeout: 30000 });
    await expect(years.getByRole("button", { name: String(year), exact: true })).toHaveCount(0);
    await page.goto(`/mobile/donate/print?year=${year}`);
    await expect(page.getByText(/giving statement isn't available/i)).toBeVisible({ timeout: 30000 });
  });
});

// Mixed-currency giving: each gift keeps its own currency in the history list, but the Year-to-Date and
// history totals are converted into the church currency (USD on Grace) with the Api's own exchange rates.
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

  test("Giving plate year-to-date total converts the euro gift and says so", async ({ page }) => {
    await page.goto("/mobile/donate");
    await expect(page.getByTestId("giving-ytd-total")).toHaveText(expectedYtd, { timeout: 30000 });
    await expect(page.getByTestId("giving-ytd-converted-note")).toHaveText(CONVERTED_NOTE);
  });

  test("History all-years total is converted while the gift row stays in euros", async ({ page }) => {
    await page.goto("/mobile/donate?view=history");
    const allYears = page.getByRole("group", { name: "Years" }).getByRole("button", { name: "All", exact: true });
    await allYears.waitFor({ state: "visible", timeout: 15000 });
    await allYears.click();
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
      window.close = () => {};
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

// Lessons.church (CHU00000099) records gifts but has no payment gateway. A signed-in member still sees
// their history, year total and Print Statement on Giving, Me and Home; only online giving is hidden.
test.describe.serial("Mobile donate without online giving", () => {
  test.use({ storageState: { cookies: [], origins: [] }, baseURL: "http://lessonschurch.localtest.me:3301" });

  const MAIN_API = process.env.API_BASE || "http://localhost:8084";
  const CHURCH = "CHU00000099";
  const EMAIL = "lessons-admin@demo.churchapps.org";
  const PERSON = "PER00000099";

  let ctx: APIRequestContext;
  let headers: Record<string, string>;
  const created: { fund?: string; batch?: string; donation?: string; link?: string } = {};

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const login = await (await ctx.post(`${MAIN_API}/membership/users/login`, { data: { email: EMAIL, password: "password" } })).json();
    const uc = login.userChurches.find((c: any) => c.church?.id === CHURCH);
    headers = { Authorization: `Bearer ${uc.jwt}` };
    const configured = await (await ctx.get(`${MAIN_API}/giving/gateways/configured/${CHURCH}`)).json();
    expect(configured.configured).toBe(false);

    const [fund] = await (await ctx.post(`${MAIN_API}/giving/funds`, { headers, data: [{ name: "E2E General Fund", taxDeductible: true }] })).json();
    created.fund = fund.id;
    const [batch] = await (await ctx.post(`${MAIN_API}/giving/donationbatches`, { headers, data: [{ name: "E2E Check Batch", batchDate: new Date() }] })).json();
    created.batch = batch.id;
    const [donation] = await (await ctx.post(`${MAIN_API}/giving/donations`, {
      headers,
      data: [{ batchId: batch.id, personId: PERSON, donationDate: new Date(), amount: 75, method: "Check", methodDetails: "1001" }]
    })).json();
    created.donation = donation.id;
    const fd = await ctx.post(`${MAIN_API}/giving/funddonations`, { headers, data: [{ donationId: donation.id, fundId: fund.id, amount: 75 }] });
    expect(fd.ok()).toBeTruthy();

    // Home only teases giving when the church's app nav has a donation link.
    const [link] = await (await ctx.post(`${MAIN_API}/content/links`, {
      headers,
      data: [{ churchId: CHURCH, category: "b1Tab", linkType: "donation", text: "Giving", sort: 20, visibility: "everyone" }]
    })).json();
    created.link = link.id;
  });

  test.afterAll(async () => {
    if (created.link) await ctx.delete(`${MAIN_API}/content/links/${created.link}`, { headers });
    if (created.donation) await ctx.delete(`${MAIN_API}/giving/donations/${created.donation}`, { headers });
    if (created.batch) await ctx.delete(`${MAIN_API}/giving/donationbatches/${created.batch}`, { headers });
    if (created.fund) await ctx.delete(`${MAIN_API}/giving/funds/${created.fund}`, { headers });
    await ctx.dispose();
  });

  const signIn = async (page: Page) => {
    await page.goto("/mobile/login");
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill("password");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });
  };

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
    await expect(email).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("heading", { name: "Lessons.church Free Curriculum" })).toBeVisible();
    const fits = await email.evaluate((el) => el.scrollWidth <= el.clientWidth);
    expect(fits, "email overflows its column").toBe(true);
  });

  test("Me shows the giving shortcut without a gateway", async ({ page }) => {
    await signIn(page);
    await page.goto("/mobile/me");
    await expect(page.getByTestId("me-shortcut-donate")).toBeVisible({ timeout: 30000 });
  });

  test("Home shows the giving total without a Give button", async ({ page }) => {
    await signIn(page);
    await page.goto("/mobile/dashboard");
    await expect(page.getByTestId("home-giving-total")).toBeVisible({ timeout: 30000 });
    const main = page.locator("main");
    await expect(main.getByRole("button", { name: "Give", exact: true })).toHaveCount(0);
    // The teaser's Give is a link styled as a button.
    await expect(main.getByRole("link", { name: "Give", exact: true })).toHaveCount(0);
  });
});
