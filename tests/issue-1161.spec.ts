import { test, expect, request } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";

// setHidePublicSite mutates a church-wide setting every public route reads.
test.describe.configure({ mode: "serial" });

async function setHidePublicSite(value: boolean) {
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
  const setting = (settings || []).find((x: any) => x.keyName === "hidePublicSite")
    || { keyName: "hidePublicSite", public: 1 };
  setting.value = `${value}`;
  const res = await ctx.post(API_BASE + "/content/settings", { headers, data: [setting] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  await ctx.post(BASE_URL + "/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
  await ctx.dispose();
}

// Issue #1161: with Disable Public Website on, signed-in members were bounced back to /login.
test.describe("Disabled public website — signed-in member", () => {
  test.beforeAll(async () => { await setHidePublicSite(true); });
  test.afterAll(async () => { await setHidePublicSite(false); });

  test("can open website pages without being sent to login", async ({ page }) => {
    for (const path of ["/", "/donate"]) {
      const res = await page.goto(path);
      await expect(page).not.toHaveURL(/\/login/);
      expect(res?.status()).toBeLessThan(400);
    }
  });

  test("the login page sends an existing session on to returnUrl", async ({ page }) => {
    await page.goto("/login?returnUrl=%2Fsermons");
    await page.waitForURL(/\/sermons/, { timeout: 30000 });
  });
});
