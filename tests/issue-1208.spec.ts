import { test, expect, request } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const PAST_TITLE = "Issue 1208 Past Registration Event";

// Issue #1208: the mobile Groups "Upcoming Events" section listed registration-enabled events that already ended.
test.describe.serial("Mobile groups upcoming events", () => {
  let staffJwt: string;
  let eventId: string;

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const loginRes = await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    const uc = (loginBody.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || loginBody.userChurches?.[0];
    staffJwt = uc?.jwt as string;
    expect(staffJwt, "staff jwt").toBeTruthy();

    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(12, 0, 0, 0);

    const res = await ctx.post(`${API_BASE}/content/events`, {
      headers: { Authorization: "Bearer " + staffJwt },
      data: [{ groupId: "GRP00000030", title: PAST_TITLE, start, end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 20 }]
    });
    expect(res.ok()).toBeTruthy();
    eventId = (await res.json())[0]?.id;
    expect(eventId, "created event id").toBeTruthy();
    await ctx.dispose();
  });

  test.afterAll(async () => {
    if (!eventId) return;
    const ctx = await request.newContext();
    await ctx.delete(`${API_BASE}/content/events/${eventId}`, { headers: { Authorization: "Bearer " + staffJwt } }).catch(() => { });
    await ctx.dispose();
  });

  test("past registration events are not listed under Upcoming Events", async ({ page }) => {
    await page.goto("/mobile/groups");
    const main = page.locator("main");
    await expect(main.getByText("Upcoming Events")).toBeVisible({ timeout: 15000 });
    await expect(main.getByText(/Vacation Bible School/i).first()).toBeVisible();
    await expect(main.getByText(PAST_TITLE)).toHaveCount(0);
  });
});
