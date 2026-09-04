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

// Country receipt formats: the donor-facing statement mirrors the B1Admin legal block,
// driven by the church's statement-format settings.
test.describe.serial("Mobile donate statement receipt formats", () => {
  const MAIN_API = "http://localhost:8084";
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
