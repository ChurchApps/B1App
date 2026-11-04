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

// Both describes rewrite ELE00000054, so keep them on one worker, in order.
test.describe.configure({ mode: "serial" });

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

  test("desktop event page shows the whole 16:9 photo", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/events/${EVENT_ID}`);
    const photo = page.getByTestId("event-photo");
    await expect(photo).toHaveAttribute("src", /worship\.jpg/, { timeout: 30000 });
    const ratio = await photo.evaluate((el) => el.getBoundingClientRect().width / el.getBoundingClientRect().height);
    expect(ratio).toBeCloseTo(16 / 9, 1);
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

  test("Calendar element with a tag shows only events carrying that tag", async ({ page }) => {
    const current = await (await ctx.get(`${API_BASE}/content/events/${EVENT_ID}`, auth)).json();
    const tagRes = await ctx.post(`${API_BASE}/content/events`, { ...auth, data: [{ ...current, tags: "Youth, students" }] });
    expect(tagRes.ok()).toBeTruthy();
    const element = await (await ctx.get(`${API_BASE}/content/elements/${ELEMENT_ID}`, auth)).json();
    const answers = { ...JSON.parse(element.answersJSON || "{}"), display: "upcoming", tag: "youth" };
    const elementRes = await ctx.post(`${API_BASE}/content/elements`, { ...auth, data: [{ ...element, answersJSON: JSON.stringify(answers) }] });
    expect(elementRes.ok()).toBeTruthy();

    try {
      await page.goto("/events");
      const tiles = page.getByTestId("upcoming-event-tile");
      await expect.poll(() => tiles.count(), { timeout: 30000 }).toBe(1);
      await expect(tiles.first()).toContainText("Sunday Morning Service");
    } finally {
      await ctx.post(`${API_BASE}/content/events`, { ...auth, data: [{ ...current, tags: null }] });
      delete answers.tag;
      await ctx.post(`${API_BASE}/content/elements`, { ...auth, data: [{ ...element, answersJSON: JSON.stringify(answers) }] });
    }
  });
});

// ChurchAppsSupport#1399: the Calendar element's Upcoming events can scroll on its own, like the Verse of the Day week.
// ELE00000054 is the Events page calendar element (Api/tools/dbScripts/content/demo.sql).
test.describe.serial("Upcoming events scrolling layout", () => {
  let ctx: APIRequestContext;
  let auth: { headers: Record<string, string> };
  let originalElement: any;

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const body = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID) || body.userChurches?.[0];
    auth = { headers: { Authorization: "Bearer " + uc.jwt } };
    originalElement = await (await ctx.get(`${API_BASE}/content/elements/${ELEMENT_ID}`, auth)).json();
    const answers = { ...JSON.parse(originalElement.answersJSON || "{}"), display: "upcoming", layout: "autoscroll" };
    const res = await ctx.post(`${API_BASE}/content/elements`, { ...auth, data: [{ ...originalElement, answersJSON: JSON.stringify(answers) }] });
    expect(res.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    if (originalElement?.id) await ctx.post(`${API_BASE}/content/elements`, { ...auth, data: [originalElement] }).catch(() => { });
    await ctx.dispose();
  });

  test("scrolling layout puts the event tiles in one row that moves by itself", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/events");
    const strip = page.getByTestId("upcoming-events-strip");
    await expect(strip).toBeVisible({ timeout: 30000 });
    await expect.poll(() => strip.getByTestId("upcoming-event-tile").count(), { timeout: 30000 }).toBeGreaterThanOrEqual(5);
    // The layout remounts once the client locale loads, so poll the row check rather than reading it once.
    const rowTops = () => strip.getByTestId("upcoming-event-tile").evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    await expect.poll(async () => { const tops = await rowTops(); return tops.length >= 5 ? new Set(tops).size : -1; }, { message: "all tiles share one row", timeout: 15000 }).toBe(1);
    await page.mouse.move(0, 0);
    await expect.poll(() => strip.evaluate((el) => el.scrollLeft), { timeout: 15000 }).toBeGreaterThan(0);
  });

  // ChurchAppsSupport#1454: one dot per event under the row, the current one marked; a dot jumps to its tile.
  test("scrolling layout shows a dot per event and a dot jumps to that event", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/events");
    const strip = page.getByTestId("upcoming-events-strip");
    await expect(strip).toBeVisible({ timeout: 30000 });
    await expect.poll(() => strip.getByTestId("upcoming-event-tile").count(), { timeout: 30000 }).toBeGreaterThanOrEqual(5);
    const count = await strip.getByTestId("upcoming-event-tile").count();
    const dots = page.getByTestId("upcoming-events-strip-dots").getByRole("button");
    await expect(dots).toHaveCount(count);
    await page.mouse.move(0, 0);
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true", { timeout: 15000 });
    await expect(dots.first()).not.toHaveAttribute("aria-current", "true");
    await dots.nth(2).click();
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
    const thirdAtEdge = () => strip.evaluate((el) => {
      const third = el.children[2] as HTMLElement;
      return Math.abs(third.getBoundingClientRect().left - el.getBoundingClientRect().left);
    });
    await expect.poll(thirdAtEdge, { timeout: 5000 }).toBeLessThanOrEqual(2);
  });

  // ChurchAppsSupport#1442: tiles are half the row on a desktop with a full 16:9 photo, so three already overflow.
  test("scrolling tiles are two per desktop row with a 16:9 photo", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/events");
    const strip = page.getByTestId("upcoming-events-strip");
    await expect(strip).toBeVisible({ timeout: 30000 });
    const tiles = strip.getByTestId("upcoming-event-tile");
    await expect.poll(() => tiles.count(), { timeout: 30000 }).toBeGreaterThanOrEqual(3);
    // Two tiles and the 24px gap fill the row.
    const halfRowGap = () => strip.evaluate((el) => Math.abs((el.firstElementChild as HTMLElement).offsetWidth - (el.clientWidth - 24) / 2));
    await expect.poll(halfRowGap, { timeout: 15000 }).toBeLessThanOrEqual(2);
    expect(await strip.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    const ratio = await tiles.first().locator("div").first().evaluate((el) => el.getBoundingClientRect().width / el.getBoundingClientRect().height);
    expect(ratio).toBeCloseTo(16 / 9, 1);
  });
});

// ChurchAppsSupport#1442: the Group List element gets the same Scrolling (automatic) layout.
// The demo seed has three public groups labelled "worship" (Api/tools/dbScripts/membership/demo.sql); SEC00000019 is the Events page section.
test.describe.serial("Group list scrolling layout", () => {
  let ctx: APIRequestContext;
  let auth: { headers: Record<string, string> };
  let elementId: string | undefined;

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const body = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID) || body.userChurches?.[0];
    auth = { headers: { Authorization: "Bearer " + uc.jwt } };
    const res = await ctx.post(`${API_BASE}/content/elements`, { ...auth, data: [{ churchId: DEMO_CHURCH.ID, sectionId: "SEC00000019", elementType: "groupList", sort: 3, answersJSON: JSON.stringify({ label: "worship", layout: "autoscroll" }) }] });
    expect(res.ok()).toBeTruthy();
    elementId = (await res.json())[0]?.id;
    expect(elementId).toBeTruthy();
  });

  test.afterAll(async () => {
    if (elementId) await ctx.delete(`${API_BASE}/content/elements/${elementId}`, auth).catch(() => { });
    await ctx.dispose();
  });

  test("scrolling layout puts three group cards in one row that moves by itself on a desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/events");
    const strip = page.getByTestId("group-list-strip");
    await expect(strip).toBeVisible({ timeout: 30000 });
    const tiles = strip.getByTestId("group-list-tile");
    await expect.poll(() => tiles.count(), { timeout: 30000 }).toBe(3);
    const rowTops = () => tiles.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    await expect.poll(async () => new Set(await rowTops()).size, { message: "all cards share one row", timeout: 15000 }).toBe(1);
    expect(await strip.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await page.mouse.move(0, 0);
    await expect.poll(() => strip.evaluate((el) => el.scrollLeft), { timeout: 15000 }).toBeGreaterThan(0);
  });
});

// ChurchAppsSupport#1448: the Groups Browser element offers the same Scrolling (automatic) layout as the Group List.
test.describe.serial("Groups browser scrolling layout", () => {
  let ctx: APIRequestContext;
  let auth: { headers: Record<string, string> };
  let elementId: string | undefined;

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const body = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID) || body.userChurches?.[0];
    auth = { headers: { Authorization: "Bearer " + uc.jwt } };
    const res = await ctx.post(`${API_BASE}/content/elements`, { ...auth, data: [{ churchId: DEMO_CHURCH.ID, sectionId: "SEC00000019", elementType: "groups", sort: 4, answersJSON: JSON.stringify({ title: "Worship Groups", label: "worship", layout: "autoscroll" }) }] });
    expect(res.ok()).toBeTruthy();
    elementId = (await res.json())[0]?.id;
    expect(elementId).toBeTruthy();
  });

  test.afterAll(async () => {
    if (elementId) await ctx.delete(`${API_BASE}/content/elements/${elementId}`, auth).catch(() => { });
    await ctx.dispose();
  });

  test("scrolling layout puts the browser's group cards in one row that moves by itself on a desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/events");
    const strip = page.getByTestId("groups-browser-strip");
    await expect(strip).toBeVisible({ timeout: 30000 });
    const tiles = strip.getByTestId("groups-browser-tile");
    await expect.poll(() => tiles.count(), { timeout: 30000 }).toBe(3);
    const rowTops = () => tiles.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    await expect.poll(async () => new Set(await rowTops()).size, { message: "all cards share one row", timeout: 15000 }).toBe(1);
    expect(await strip.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await page.mouse.move(0, 0);
    await expect.poll(() => strip.evaluate((el) => el.scrollLeft), { timeout: 15000 }).toBeGreaterThan(0);
  });
});
