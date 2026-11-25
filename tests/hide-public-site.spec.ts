import { test, expect, request, type Page } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";

// setHidePublicSite mutates a church-wide setting every public route reads.
test.describe.configure({ mode: "serial" });

interface LoginChurch { church?: { id?: string }; apis?: { keyName?: string; jwt?: string }[] }
interface Setting { id?: string; keyName?: string; value?: string; public?: number }

const setHidePublicSite = (value: boolean) => setContentSetting("hidePublicSite", `${value}`);

async function setContentSetting(keyName: string, value: string) {
  const ctx = await request.newContext();
  const login = await ctx.post(API_BASE + "/membership/users/login", {
    data: { email: "demo@b1.church", password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const body = await login.json();
  const uc = ((body.userChurches || []) as LoginChurch[]).find((c) => c.church?.id === DEMO_CHURCH.ID);
  const jwt = uc?.apis?.find((a) => a.keyName === "ContentApi")?.jwt;
  if (!jwt) throw new Error("ContentApi JWT not present");
  const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
  const settings: Setting[] = (await (await ctx.get(API_BASE + "/content/settings", { headers })).json()) || [];
  const setting = settings.find((x) => x.keyName === keyName) || { keyName, public: 1 };
  setting.value = value;
  const res = await ctx.post(API_BASE + "/content/settings", { headers, data: [setting] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  // Same cache bust B1Admin fires on save.
  await ctx.post(BASE_URL + "/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
  await ctx.dispose();
}

test.describe("Disabled public website", () => {
  test.beforeAll(async () => { await setHidePublicSite(true); });
  test.afterAll(async () => { await setHidePublicSite(false); });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("sends the home page to the login screen", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("passes the requested page to login as returnUrl", async ({ page }) => {
    await page.goto("/donate");
    await expect(page).toHaveURL(/\/login/);
    expect(new URL(page.url()).searchParams.get("returnUrl")).toBe("/donate");
  });

  for (const path of ["/about", "/donate", "/sermons", "/bible", "/votd", "/stream", "/groups"]) {
    test(`sends ${path} to the login screen`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("keeps the login screen and guest registration reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 30000 });
    await page.goto("/guest-register");
    await expect(page).toHaveURL(/\/guest-register/);
  });

  test("keeps the member portal reachable", async ({ page }) => {
    await page.goto("/mobile");
    await expect(page).toHaveURL(/\/mobile/);
  });

  // Middleware in the production build caches a church's settings for up to a minute, so the embed tests wait for a change to land.
  const embedStatus = (page: Page) => page.request.get("/embed/donate", { maxRedirects: 0 }).then((r) => r.status());

  test("sends the embed pages to the login screen while no website is listed", async ({ page }) => {
    test.setTimeout(150000);
    await setContentSetting("embedDomains", "");
    await expect.poll(() => embedStatus(page), { timeout: 90000, intervals: [2000] }).toBe(307);
    await page.goto("/embed/donate");
    await expect(page).toHaveURL(/\/login/);
    expect(new URL(page.url()).searchParams.get("returnUrl")).toBe("/embed/donate");
    await page.goto("/embed/forms/FRM00000004");
    await expect(page).toHaveURL(/\/login/);
  });

  // A church that keeps its own website embeds these pages in it.
  test("serves the embed pages once the church has listed a website", async ({ page }) => {
    test.setTimeout(150000);
    await setContentSetting("embedDomains", "embed-test-church.org");
    try {
      await expect.poll(() => embedStatus(page), { timeout: 90000, intervals: [2000] }).toBe(200);
      await page.goto("/embed/donate");
      await expect(page).toHaveURL(/\/embed\/donate$/);
      await expect(page.getByTestId("embed-donate")).toBeVisible();
      await page.goto("/embed/forms/FRM00000004");
      await expect(page).toHaveURL(/\/embed\/forms\/FRM00000004$/);
      // Only the embed routes open: the public pages and any other /embed/ path stay behind the login screen.
      for (const path of ["/donate", "/embed", "/embed/login"]) {
        await page.goto(path);
        await expect(page, path).toHaveURL(/\/login/);
      }
    } finally {
      await setContentSetting("embedDomains", "");
    }
  });

  test("tells search engines not to index the site", async ({ request: req }) => {
    const robots = await (await req.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /\n");
    expect(robots).not.toContain("Allow: /");
    expect(robots).not.toContain("Sitemap:");
    const sitemap = await (await req.get("/sitemap.xml")).text();
    expect(sitemap).toContain("<urlset");
    expect(sitemap).not.toContain("<url>");
  });
});

// Uses the signed-in demo member from tests/global-setup.ts, so cookies are kept.
test.describe("Disabled public website — signed-in member", () => {
  test.beforeAll(async () => { await setHidePublicSite(true); });
  test.afterAll(async () => { await setHidePublicSite(false); });

  for (const path of ["/", "/donate", "/groups"]) {
    test(`opens ${path} without being sent to login`, async ({ page }) => {
      const res = await page.goto(path);
      await expect(page).not.toHaveURL(/\/login/);
      expect(res?.status()).toBeLessThan(400);
    });
  }

  test("the login page sends an existing session on to returnUrl", async ({ page }) => {
    await page.goto("/login?returnUrl=%2Fsermons");
    await expect(page).toHaveURL(/\/sermons$/, { timeout: 30000 });
  });
});
