import { test, expect, request } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";

const ANNOUNCEMENT = {
  text: "Join us for our community Thanksgiving dinner this Sunday after the second service in the fellowship hall",
  linkUrl: "/",
  linkText: "Thanksgiving"
};

// The announcement is a church-wide setting every public page reads.
test.describe.configure({ mode: "serial" });

async function setAnnouncement(value: string) {
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
  const setting = (settings || []).find((x: any) => x.keyName === "announcementBanner")
    || { keyName: "announcementBanner", public: 1 };
  setting.value = value;
  const res = await ctx.post(API_BASE + "/content/settings", { headers, data: [setting] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  await ctx.post(BASE_URL + "/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
  await ctx.dispose();
}

test.describe("Website announcement bar on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, storageState: { cookies: [], origins: [] } });

  test.beforeAll(async () => { await setAnnouncement(JSON.stringify(ANNOUNCEMENT)); });
  test.afterAll(async () => { await setAnnouncement(""); });

  test("leaves the menu button uncovered so the menu opens", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".announcement-banner")).toBeVisible();
    const menuButton = page.getByTestId("mobile-menu-button");
    await expect(menuButton).toBeVisible();

    await expect.poll(() => menuButton.evaluate((btn) => {
      const r = btn.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit && btn.contains(hit);
    })).toBe(true);

    await menuButton.click();
    await expect(page.locator(".MuiDrawer-paper")).toBeVisible();
  });
});
