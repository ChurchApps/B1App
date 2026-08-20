import { test, expect, request, type Page, type APIRequestContext } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// ChurchAppsSupport #985: church.firstDayOfWeek (0=Sun..6=Sat) drives the group
// calendar week grid. Mutates the seeded church's setting, so runs serially and
// restores the original value when done.
const API_BASE = "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000004";
const SUBDOMAIN = "grace";

async function adminContext(): Promise<{ ctx: APIRequestContext; auth: { headers: { Authorization: string } } }> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || body.userChurches?.[0];
  const jwt = uc?.jwt as string;
  expect(jwt, "admin jwt").toBeTruthy();
  return { ctx, auth: { headers: { Authorization: "Bearer " + jwt } } };
}

async function setFirstDayOfWeek(value: number | undefined): Promise<void> {
  const { ctx, auth } = await adminContext();
  const churchRes = await ctx.get(`${API_BASE}/membership/churches/${CHURCH_ID}`, auth);
  expect(churchRes.ok()).toBeTruthy();
  const church = await churchRes.json();
  const saveRes = await ctx.post(`${API_BASE}/membership/churches/`, { ...auth, data: [{ ...church, firstDayOfWeek: value }] });
  expect(saveRes.ok(), `church save failed: ${saveRes.status()}`).toBeTruthy();
  await ctx.dispose();
}

async function readWeekdayHeaders(page: Page): Promise<string[]> {
  await page.goto(`/mobile/groups/${GROUP_ID}`);
  await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
  await page.getByRole("tab", { name: /Events/i }).click();
  await expect(page.getByTestId("weekday-0")).toBeVisible({ timeout: 15000 });
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) labels.push((await page.getByTestId(`weekday-${i}`).innerText()).trim());
  return labels;
}

test.describe.serial("Group calendar first day of week", () => {
  let originalFirstDay: number | undefined;

  test.beforeAll(async () => {
    const { ctx, auth } = await adminContext();
    const res = await ctx.get(`${API_BASE}/membership/churches/${CHURCH_ID}`, auth);
    expect(res.ok()).toBeTruthy();
    originalFirstDay = (await res.json()).firstDayOfWeek;
    await ctx.dispose();
  });

  test.afterAll(async () => {
    await setFirstDayOfWeek(originalFirstDay);
  });

  test("church lookup exposes firstDayOfWeek", async () => {
    await setFirstDayOfWeek(1);
    const ctx = await request.newContext();
    const res = await ctx.get(`${API_BASE}/membership/churches/lookup/?subDomain=${SUBDOMAIN}`);
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).firstDayOfWeek).toBe(1);
    await ctx.dispose();
  });

  test("Monday-first church renders the week grid starting on Monday", async ({ page }) => {
    await setFirstDayOfWeek(1);
    expect(await readWeekdayHeaders(page)).toEqual(["M", "T", "W", "T", "F", "S", "S"]);

    // The first-of-month cell must land in the rotated column, not just relabel headers.
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const iso = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-01`;
    const expectedColumn = (first.getDay() - 1 + 7) % 7;
    const headerBox = await page.getByTestId(`weekday-${expectedColumn}`).boundingBox();
    const dayBox = await page.getByTestId(`day-${iso}`).boundingBox();
    expect(headerBox && dayBox).toBeTruthy();
    const headerCenter = headerBox!.x + headerBox!.width / 2;
    const dayCenter = dayBox!.x + dayBox!.width / 2;
    expect(Math.abs(headerCenter - dayCenter)).toBeLessThan(headerBox!.width / 2);
  });

  test("Sunday-first church renders the default week grid", async ({ page }) => {
    await setFirstDayOfWeek(0);
    expect(await readWeekdayHeaders(page)).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
  });
});
