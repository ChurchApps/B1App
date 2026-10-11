import { test, expect, request, type Page } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";
const CHURCH_GA_ID = "G-B1APPTEST";

// The church's GA4 id is a church-wide setting the public site also reads.
test.describe.configure({ mode: "serial" });

async function setChurchGaId(value: string) {
  const ctx = await request.newContext();
  const login = await ctx.post(API_BASE + "/membership/users/login", {
    data: { email: "demo@b1.church", password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const body = await login.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID);
  const jwt = uc?.apis?.find((a: any) => a.keyName === "ContentApi")?.jwt;
  if (!jwt) throw new Error("ContentApi JWT not present");
  const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
  const settings = await (await ctx.get(API_BASE + "/content/settings", { headers })).json();
  const setting = (settings || []).find((x: any) => x.keyName === "ga4MeasurementId")
    || { keyName: "ga4MeasurementId", public: 1 };
  setting.value = value;
  const res = await ctx.post(API_BASE + "/content/settings", { headers, data: [setting] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  // Same cache bust B1Admin fires on save.
  await ctx.post(BASE_URL + "/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
  await ctx.dispose();
}

// gtag.js is stubbed so the test reads exactly what the page queued.
async function stubGtag(page: Page) {
  await page.route(/googletagmanager\.com/, (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
}

async function configCalls(page: Page, id: string) {
  return page.evaluate((gaId) => ((window as any).dataLayer || [])
    .map((entry: any) => Array.from(entry))
    .filter((args: any[]) => args[0] === "config" && args[1] === gaId)
    .map((args: any[]) => args[2] || {}), id);
}

test.describe("Church Google Analytics in the B1 app", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.beforeAll(async () => { await setChurchGaId(CHURCH_GA_ID); });
  test.afterAll(async () => { await setChurchGaId(""); });

  test("sends app page views to the church's GA4 id, tagged as browser", async ({ page }) => {
    await stubGtag(page);
    await page.goto("/mobile");
    await expect.poll(() => configCalls(page, CHURCH_GA_ID), { timeout: 30000 })
      .toContainEqual(expect.objectContaining({ display_mode: "browser" }));
  });

  test("tags home-screen launches as installed", async ({ page }) => {
    await stubGtag(page);
    await page.addInitScript(() => { Object.defineProperty(window.navigator, "standalone", { value: true, configurable: true }); });
    await page.goto("/mobile");
    await expect.poll(() => configCalls(page, CHURCH_GA_ID), { timeout: 30000 })
      .toContainEqual(expect.objectContaining({ display_mode: "installed" }));
  });
});

test.describe("Invalid church Google Analytics id", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.beforeAll(async () => { await setChurchGaId("GTM-B1APPTEST"); });
  test.afterAll(async () => { await setChurchGaId(""); });

  test("is not added to the B1 app", async ({ page }) => {
    await stubGtag(page);
    await page.goto("/mobile");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("script#mobile-google-analytics")).toHaveCount(0);
    expect(await configCalls(page, "GTM-B1APPTEST")).toEqual([]);
  });
});
