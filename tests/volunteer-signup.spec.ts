import { test as publicTest, expect as publicExpect } from "@playwright/test";
import { loggedInTest as test, expect } from "./helpers/test-fixtures";
import { getApi, apiCall, doingUrl, type ApiHandle } from "./helpers/api";

// Volunteer signup reads the deadline instant the Api returns, counted back from the
// first service time (ChurchAppsSupport#1325). One plan is still open on its service
// day; the other closed before now. Both screens: PWA and the public website.
test.describe.configure({ mode: "serial" });

const HOUR = 60 * 60 * 1000;
const CHURCH_ID = "CHU00000001";

type SignupPlan = { planId: string; positionName: string };

let api: ApiHandle;
const created: string[] = [];

// Service date is today; the first service time is hoursAhead from now.
const createPlan = async (label: string, hoursAhead: number, signupDeadlineHours: number): Promise<SignupPlan> => {
  const template = await (await apiCall(api, "get", doingUrl("/plans/PLA00000001"))).json();
  const start = new Date(Date.now() + hoursAhead * HOUR);
  const end = new Date(start.getTime() + HOUR);
  // Today on the local calendar, the same day CURDATE and the Api's serviceDate use.
  const now = new Date();
  const serviceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [plan] = await (await apiCall(api, "post", doingUrl("/plans"), [{ ministryId: template.ministryId, planTypeId: template.planTypeId, name: `E2E Signup ${label}`, serviceDate, signupDeadlineHours }])).json();
  created.push(plan.id);
  await apiCall(api, "post", doingUrl("/times"), [{ planId: plan.id, displayName: "Service", startTime: start.toISOString(), endTime: end.toISOString(), teams: "", serviceTimeType: "service" }]);
  const positionName = `E2E Signup ${label} Greeter`;
  await apiCall(api, "post", doingUrl("/positions"), [{ planId: plan.id, categoryName: "Hospitality", name: positionName, count: 2, allowSelfSignup: true }]);
  return { planId: plan.id, positionName };
};

// The screens must have the Api instant to work from; fail before opening the page if it is absent.
const expectApiDeadline = async (planId: string, open: boolean) => {
  const res = await apiCall(api, "get", doingUrl(`/plans/public/signup/${CHURCH_ID}`));
  expect(res.ok()).toBeTruthy();
  const entry = ((await res.json()) as any[]).find((sp) => sp?.plan?.id === planId);
  expect(entry, "plan listed for public signup").toBeTruthy();
  const deadline = entry.plan.signupDeadline;
  expect(typeof deadline).toBe("string");
  const at = new Date(deadline).getTime();
  expect(Number.isNaN(at)).toBe(false);
  if (open) expect(at).toBeGreaterThan(Date.now());
  else expect(at).toBeLessThan(Date.now());
};

test.describe("Volunteer signup deadline", () => {
  let openPlan: SignupPlan;
  let closedPlan: SignupPlan;

  test.beforeAll(async () => {
    api = await getApi("demo");
    // Service six hours ahead with a one-hour deadline: open on the service day.
    openPlan = await createPlan("Open", 6, 1);
    // Service two hours ahead with a 24-hour deadline: closed yesterday.
    closedPlan = await createPlan("Closed", 2, 24);
  });

  test.afterAll(async () => {
    for (const id of created) await apiCall(api, "delete", doingUrl(`/plans/${id}`));
    await api?.request.dispose();
  });

  test("PWA keeps signup open until the deadline before the service", async ({ page }) => {
    await expectApiDeadline(openPlan.planId, true);
    await page.goto(`/mobile/volunteer/${openPlan.planId}`, { timeout: 60000 });
    const main = page.locator("main");
    await expect(main.getByText(openPlan.positionName)).toBeVisible({ timeout: 30000 });
    await expect(main.getByText("Signup deadline has passed.")).toHaveCount(0);
    await expect(main.getByRole("button", { name: /^Sign Up$/i }).first()).toBeEnabled();
  });

  test("website keeps signup open until the deadline before the service", async ({ page }) => {
    await expectApiDeadline(openPlan.planId, true);
    await page.goto(`/volunteer/${openPlan.planId}`, { timeout: 60000 });
    await expect(page.getByText(openPlan.positionName)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("The signup deadline for this plan has passed.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Sign Up$/i }).first()).toBeEnabled({ timeout: 15000 });
  });

  test("PWA closes signup once the deadline has passed", async ({ page }) => {
    await expectApiDeadline(closedPlan.planId, false);
    await page.goto(`/mobile/volunteer/${closedPlan.planId}`, { timeout: 60000 });
    const main = page.locator("main");
    await expect(main.getByText(closedPlan.positionName)).toBeVisible({ timeout: 30000 });
    await expect(main.getByText("Signup deadline has passed.")).toBeVisible();
    await expect(main.getByRole("button", { name: /^Sign Up$/i, disabled: false })).toHaveCount(0);
  });

  test("website closes signup once the deadline has passed", async ({ page }) => {
    await expectApiDeadline(closedPlan.planId, false);
    await page.goto(`/volunteer/${closedPlan.planId}`, { timeout: 60000 });
    await expect(page.getByText(closedPlan.positionName)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("The signup deadline for this plan has passed.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Sign Up$/i }).first()).toBeDisabled();
  });
});

// ChurchAppsSupport#1335: the public volunteer pages showed each plan's service date one
// day early for visitors west of the Api's time zone. serviceDate is a date-only column
// that reaches the browser as midnight in the Api's zone; a visitor in Los Angeles read
// it as the evening before.
publicTest.describe("Volunteer service date for a visitor west of the Api", () => {
  const API_BASE = process.env.API_BASE || "http://localhost:8084";
  const PLAN_ID = "PLA00000001";

  publicTest.use({ storageState: { cookies: [], origins: [] }, timezoneId: "America/Los_Angeles", locale: "en-US" });

  const expectedDate = async (request: any) => {
    const res = await request.get(`${API_BASE}/doing/plans/public/signup/${CHURCH_ID}`);
    publicExpect(res.ok()).toBeTruthy();
    const entry = ((await res.json()) as any[]).find((sp) => sp?.plan?.id === PLAN_ID);
    publicExpect(entry, "demo plan listed for public signup").toBeTruthy();
    // The calendar day the Api stored, independent of any browser time zone.
    const [y, m, d] = String(entry.plan.serviceDate).slice(0, 10).split("-").map(Number);
    return { name: entry.plan.name as string, text: new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" }) };
  };

  publicTest("volunteer list shows the plan's real service date", async ({ page, request }) => {
    const { name, text } = await expectedDate(request);
    await page.goto("/volunteer");
    const card = page.locator(".MuiCard-root").filter({ has: page.getByRole("heading", { name, exact: true }) });
    // The server renders in its own zone; wait for the browser render (labels loaded) before reading the date.
    await publicExpect(card).toContainText(/spots open|Full/);
    await publicExpect(card).toContainText(text);
  });

  publicTest("volunteer signup page shows the plan's real service date", async ({ page, request }) => {
    const { name, text } = await expectedDate(request);
    await page.goto(`/volunteer/${PLAN_ID}`);
    await publicExpect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
    // Same as above: wait for the browser render before reading the date.
    await publicExpect(page.getByText("to sign up for a position.")).toBeVisible();
    await publicExpect(page.getByRole("heading", { name, level: 1 }).locator("xpath=following-sibling::p[1]")).toContainText(text);
  });
});
