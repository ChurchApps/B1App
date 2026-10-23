import { test, expect } from "@playwright/test";

// Issue #1335: the public volunteer pages showed each plan's service date one day
// early for visitors west of the Api's time zone. serviceDate is a date-only column
// that reaches the browser as midnight in the Api's zone; a visitor in Los Angeles
// read it as the evening before.
const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const PLAN_ID = "PLA00000001";

test.use({ storageState: { cookies: [], origins: [] }, timezoneId: "America/Los_Angeles", locale: "en-US" });

const expectedDate = async (request: any) => {
  const res = await request.get(`${API_BASE}/doing/plans/public/signup/${CHURCH_ID}`);
  expect(res.ok()).toBeTruthy();
  const entry = ((await res.json()) as any[]).find((sp) => sp?.plan?.id === PLAN_ID);
  expect(entry, "demo plan listed for public signup").toBeTruthy();
  // The calendar day the Api stored, independent of any browser time zone.
  const [y, m, d] = String(entry.plan.serviceDate).slice(0, 10).split("-").map(Number);
  return { name: entry.plan.name as string, text: new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" }) };
};

test("volunteer list shows the plan's real service date", async ({ page, request }) => {
  const { name, text } = await expectedDate(request);
  await page.goto("/volunteer");
  const card = page.locator(".MuiCard-root").filter({ has: page.getByRole("heading", { name, exact: true }) });
  // The server renders in its own zone; wait for the browser render (labels loaded) before reading the date.
  await expect(card).toContainText(/spots open|Full/);
  await expect(card).toContainText(text);
});

test("volunteer signup page shows the plan's real service date", async ({ page, request }) => {
  const { name, text } = await expectedDate(request);
  await page.goto(`/volunteer/${PLAN_ID}`);
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  // Same as above: wait for the browser render before reading the date.
  await expect(page.getByText("to sign up for a position.")).toBeVisible();
  await expect(page.getByRole("heading", { name, level: 1 }).locator("xpath=following-sibling::p[1]")).toContainText(text);
});
