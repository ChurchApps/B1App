import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// ChurchAppsSupport#1399: the Calendar element's Upcoming events can scroll on its own, like the Verse of the Day week.
// ELE00000054 is the Events page calendar element (Api/tools/dbScripts/content/demo.sql).
const API_BASE = process.env.API_BASE || "http://localhost:8084";
const ELEMENT_ID = "ELE00000054";

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
    const tops = await strip.getByTestId("upcoming-event-tile").evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(tops).size, "all tiles share one row").toBe(1);
    await page.mouse.move(0, 0);
    await expect.poll(() => strip.evaluate((el) => el.scrollLeft), { timeout: 15000 }).toBeGreaterThan(0);
  });
});
