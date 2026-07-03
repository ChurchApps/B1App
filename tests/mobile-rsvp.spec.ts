import { test, expect, request, type Page } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// GR-1: EVT00000018 (Midweek Small Group) weekly recurring on GRP00000004 (demo + tester members)
const API_BASE = "http://localhost:8084";
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

// Open group events tab and find a matching day cell for the RSVP control.
async function openOccurrence(page: Page): Promise<void> {
  await page.goto(`/mobile/groups/${GROUP_ID}`);
  await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
  await page.getByRole("tab", { name: /Events/i }).click();
  const control = page.getByTestId(`rsvp-${EVENT_ID}`);
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
