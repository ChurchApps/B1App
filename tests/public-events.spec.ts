import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// #1265: public event pages and the Calendar element's "Upcoming events" display.
// Seed IDs: Api/tools/dbScripts/content/demo.sql — EVT00000001 Sunday Morning Service (weekly, Sanctuary booking),
// EVT00000015 Vacation Bible School (registration on), ELE00000054 Events page calendar element (CAL00000004).

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const EVENT_ID = "EVT00000001";
const REGISTERABLE_EVENT_ID = "EVT00000015";
const ELEMENT_ID = "ELE00000054";
const PHOTO = "/tempLibrary/backgrounds/worship.jpg";

test.describe.serial("Public event pages and upcoming-event tiles", () => {
  let ctx: APIRequestContext;
  let auth: { headers: Record<string, string> };
  let originalElement: any;
  let originalEvent: any;

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const loginRes = await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
    expect(loginRes.ok()).toBeTruthy();
    const body = await loginRes.json();
    const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID) || body.userChurches?.[0];
    auth = { headers: { Authorization: "Bearer " + uc.jwt } };

    originalElement = await (await ctx.get(`${API_BASE}/content/elements/${ELEMENT_ID}`, auth)).json();
    const answers = { ...JSON.parse(originalElement.answersJSON || "{}"), display: "upcoming" };
    const elementRes = await ctx.post(`${API_BASE}/content/elements`, { ...auth, data: [{ ...originalElement, answersJSON: JSON.stringify(answers) }] });
    expect(elementRes.ok()).toBeTruthy();

    originalEvent = await (await ctx.get(`${API_BASE}/content/events/${EVENT_ID}`, auth)).json();
    const eventRes = await ctx.post(`${API_BASE}/content/events`, { ...auth, data: [{ ...originalEvent, photoUrl: PHOTO }] });
    expect(eventRes.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    if (originalElement?.id) await ctx.post(`${API_BASE}/content/elements`, { ...auth, data: [originalElement] }).catch(() => { });
    if (originalEvent?.id) await ctx.post(`${API_BASE}/content/events`, { ...auth, data: [{ ...originalEvent, photoUrl: null }] }).catch(() => { });
    await ctx.dispose();
  });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("event page shows the photo banner, description, When, Where and Add to my calendar", async ({ page }) => {
    await page.goto(`/events/${EVENT_ID}`);
    await expect(page.getByRole("heading", { level: 1, name: "Sunday Morning Service" })).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("event-photo")).toHaveAttribute("src", /worship\.jpg/);
    await expect(page.locator("main")).toContainText("Main worship service with contemporary music");
    await expect(page.getByTestId("event-when")).toContainText(/Every week on Sunday, \d+:\d\d/);
    await expect(page.getByTestId("event-date-line")).toContainText(/Sunday, \w+ \d+, \d{4} · \d+:\d\d/);
    await expect(page.getByTestId("event-back-link")).toHaveText(/All events/);
    await expect(page.getByTestId("event-where")).toContainText("Sanctuary");
    await expect(page.getByTestId("event-register-button")).toHaveCount(0);

    const icsHref = await page.getByTestId("event-add-to-calendar").getAttribute("href");
    expect(icsHref).toMatch(new RegExp(`/events/public/${DEMO_CHURCH.ID}/${EVENT_ID}/ical$`));
    const ics = await ctx.get(icsHref!);
    expect(ics.ok()).toBeTruthy();
    expect(ics.headers()["content-type"]).toContain("text/calendar");
    expect(await ics.text()).toContain("SUMMARY:Sunday Morning Service");
  });

  test("event page offers Register for this Event when registration is on", async ({ page }) => {
    await page.goto(`/events/${REGISTERABLE_EVENT_ID}`);
    await expect(page.getByRole("heading", { level: 1, name: /Vacation Bible School/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("event-register-button")).toHaveAttribute("href", `/register/${REGISTERABLE_EVENT_ID}`);
  });

  test("unknown event id is not found", async ({ page }) => {
    const response = await page.goto("/events/EVT99999999");
    expect(response?.status()).toBe(404);
  });

  test("Events page in Upcoming events mode shows photo tiles in date order linking to event pages", async ({ page }) => {
    await page.goto("/events");
    const tiles = page.getByTestId("upcoming-event-tile");
    // The layout remounts once the client locale loads, so poll until the tile list is stable.
    await expect.poll(() => tiles.count(), { timeout: 30000 }).toBeGreaterThanOrEqual(2);
    await expect(tiles.first()).toBeVisible();
    await expect(page.getByTestId("calendar-subscribe-button")).toBeVisible();

    const starts = await tiles.evaluateAll((els) => els.map((el) => el.getAttribute("data-start") || ""));
    expect(starts).toEqual([...starts].sort());
    const now = Date.now();
    for (const s of starts) expect(new Date(s).getTime()).toBeGreaterThan(now - 24 * 60 * 60 * 1000);

    const hrefs = await tiles.evaluateAll((els) => els.map((el) => el.getAttribute("href") || ""));
    expect(new Set(hrefs).size, "a recurring event appears once").toBe(hrefs.length);
    for (const h of hrefs) expect(h).toMatch(/^\/events\/EVT\d+$/);

    const sunday = tiles.filter({ hasText: "Sunday Morning Service" }).first();
    await expect(sunday).toBeVisible();
    expect(await sunday.locator("div").first().evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("worship.jpg");
    await expect(sunday).toContainText("Main worship service");

    await tiles.first().click();
    await expect(page).toHaveURL(/\/events\/EVT\d+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
  });
});
