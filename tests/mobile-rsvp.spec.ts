import { test, expect, request, type Page } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// GR-1: EVT00000018 (Midweek Small Group) weekly recurring on GRP00000004 (demo + tester members)
const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000004";
const EVENT_ID = "EVT00000018";
// Any ISO works as an occurrence key; the endpoint upserts on it verbatim.
const OCCURRENCE = "2026-07-09T00:00:00.000Z";

async function jwtFor(email: string): Promise<string> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API_BASE}/membership/users/login`, { data: { email, password: "password" } });
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || body.userChurches?.[0];
  await ctx.dispose();
  return uc?.jwt as string;
}

// Open the group's events slice (plate "All events" link) and find a matching day cell for the RSVP control.
async function openOccurrence(page: Page): Promise<void> {
  await page.goto(`/mobile/groups/${GROUP_ID}`);
  await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: /^All events$/i }).click();
  await expect(page).toHaveURL(/view=events/, { timeout: 15000 });
  // Past occurrences have no answer buttons, so look for the first day that offers Going.
  const control = page.getByTestId(`rsvp-${EVENT_ID}-yes`);
  for (let i = 0; i < 3; i++) {
    const cells = page.locator('[data-testid^="day-"]');
    const count = await cells.count();
    for (let d = 0; d < count; d++) {
      await cells.nth(d).click();
      if (await control.isVisible().catch(() => false)) return;
    }
    await page.getByLabel(/Next month/i).click();
    await page.waitForTimeout(300);
  }
}

test.describe("Mobile group event RSVP", () => {
  test.afterAll(async () => {
    // Clean up test RSVP rows for reruns.
    const jwt = await jwtFor("demo@b1.church");
    const ctx = await request.newContext();
    await ctx.delete(`${API_BASE}/content/events/${EVENT_ID}/rsvp?occurrenceStart=${encodeURIComponent(OCCURRENCE)}`, { headers: { Authorization: "Bearer " + jwt } }).catch(() => {});
    await ctx.dispose();
  });

  test("member sets Going, it persists across reload, changes to Maybe, then clears", async ({ page }) => {
    await openOccurrence(page);
    const yes = page.getByTestId(`rsvp-${EVENT_ID}-yes`);
    await expect(yes).toBeVisible();

    await yes.click();
    await expect(yes).toContainText("1", { timeout: 10000 });

    await openOccurrence(page);
    await expect(page.getByTestId(`rsvp-${EVENT_ID}-yes`)).toContainText("1", { timeout: 10000 });

    await page.getByTestId(`rsvp-${EVENT_ID}-maybe`).click();
    await expect(page.getByTestId(`rsvp-${EVENT_ID}-maybe`)).toContainText("1", { timeout: 10000 });
    await expect(page.getByTestId(`rsvp-${EVENT_ID}-yes`)).not.toContainText("1");

    await page.getByTestId(`rsvp-${EVENT_ID}-maybe`).click();
    await expect(page.getByTestId(`rsvp-${EVENT_ID}-maybe`)).not.toContainText("1", { timeout: 10000 });
  });

  test("a past occurrence offers no answer buttons, but leaders can still view responses", async ({ page }) => {
    const jwt = await jwtFor("demo@b1.church");
    const ctx = await request.newContext();
    const auth = { headers: { Authorization: "Bearer " + jwt } };
    const start = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    start.setHours(12, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const created = await (await ctx.post(`${API_BASE}/content/events`, { ...auth, data: [{ groupId: GROUP_ID, title: `Past RSVP ${Date.now()}`, start, end, allDay: false, visibility: "public" }] })).json();
    const pastId = created[0].id;
    try {
      await page.goto(`/mobile/groups/${GROUP_ID}?view=events`);
      await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
      if (start.getMonth() !== new Date().getMonth()) await page.getByLabel(/Previous month/i).click();
      const day = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
      await page.getByTestId(`day-${day}`).click();
      // demo@b1.church is a member and can manage the group's events.
      await expect(page.getByTestId(`rsvp-roster-${pastId}`)).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId(`rsvp-${pastId}-yes`)).toHaveCount(0);
    } finally {
      await ctx.delete(`${API_BASE}/content/events/${pastId}`, auth).catch(() => {});
      await ctx.dispose();
    }
  });

  test("cross-user roster groups both responses", async () => {
    const [demoJwt, testerJwt] = await Promise.all([jwtFor("demo@b1.church"), jwtFor("tester@b1.church")]);
    expect(demoJwt).toBeTruthy();
    expect(testerJwt).toBeTruthy();
    const ctx = await request.newContext();

    await ctx.post(`${API_BASE}/content/events/${EVENT_ID}/rsvp`, { headers: { Authorization: "Bearer " + demoJwt }, data: { occurrenceStart: OCCURRENCE, response: "yes" } });
    await ctx.post(`${API_BASE}/content/events/${EVENT_ID}/rsvp`, { headers: { Authorization: "Bearer " + testerJwt }, data: { occurrenceStart: OCCURRENCE, response: "no" } });

    const batchRes = await ctx.get(`${API_BASE}/content/events/rsvps/group/${GROUP_ID}?from=2026-07-01T00:00:00.000Z&to=2026-08-01T00:00:00.000Z`, { headers: { Authorization: "Bearer " + demoJwt } });
    const batch = await batchRes.json();
    const entry = batch.find((b: any) => b.eventId === EVENT_ID);
    expect(entry, "batch entry for event").toBeTruthy();
    expect(entry.yes).toBeGreaterThanOrEqual(1);
    expect(entry.no).toBeGreaterThanOrEqual(1);

    const rosterRes = await ctx.get(`${API_BASE}/content/events/${EVENT_ID}/rsvps?occurrenceStart=${encodeURIComponent(OCCURRENCE)}`, { headers: { Authorization: "Bearer " + demoJwt } });
    expect(rosterRes.ok(), "roster read authorized for demo").toBeTruthy();
    const roster = await rosterRes.json();
    const responses = roster.map((r: any) => r.response).sort();
    expect(responses).toContain("yes");
    expect(responses).toContain("no");

    await ctx.delete(`${API_BASE}/content/events/${EVENT_ID}/rsvp?occurrenceStart=${encodeURIComponent(OCCURRENCE)}`, { headers: { Authorization: "Bearer " + testerJwt } }).catch(() => {});
    await ctx.dispose();
  });
});
