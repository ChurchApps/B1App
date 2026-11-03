import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// ChurchAppsSupport#1453: on a desktop the public event page cropped the 16:9 event photo to a 360px strip.
// Seed: Api/tools/dbScripts/content/demo.sql — EVT00000003 Adult Bible Class (no other spec gives it a photo).

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const EVENT_ID = "EVT00000003";
const PHOTO = "/tempLibrary/backgrounds/worship.jpg";

test.describe.serial("Event page photo (#1453)", () => {
  let ctx: APIRequestContext;
  let auth: { headers: Record<string, string> };
  let originalEvent: any;

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const body = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID) || body.userChurches?.[0];
    auth = { headers: { Authorization: "Bearer " + uc.jwt } };
    originalEvent = await (await ctx.get(`${API_BASE}/content/events/${EVENT_ID}`, auth)).json();
    const res = await ctx.post(`${API_BASE}/content/events`, { ...auth, data: [{ ...originalEvent, photoUrl: PHOTO }] });
    expect(res.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    if (originalEvent?.id) await ctx.post(`${API_BASE}/content/events`, { ...auth, data: [{ ...originalEvent, photoUrl: null }] }).catch(() => { });
    await ctx.dispose();
  });

  test("desktop event page shows the whole 16:9 photo", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/events/${EVENT_ID}`);
    const photo = page.getByTestId("event-photo");
    await expect(photo).toHaveAttribute("src", /worship\.jpg/, { timeout: 30000 });
    const ratio = await photo.evaluate((el) => el.getBoundingClientRect().width / el.getBoundingClientRect().height);
    expect(ratio).toBeCloseTo(16 / 9, 1);
  });
});
