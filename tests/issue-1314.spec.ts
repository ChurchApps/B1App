import { test, expect, request } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// ChurchAppsSupport#1314: people who join from the app are Guests, and "Everyone" must open the directory to them.
test.describe.configure({ mode: "serial" });

const API = process.env.API_BASE || "http://localhost:8084";
const RACHEL = "PER00000069"; // volunteer@b1.church, no People View

async function adminHeaders() {
  const ctx = await request.newContext();
  const login = await ctx.post(API + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" }, headers: { "Content-Type": "application/json" } });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const body = await login.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID);
  const jwt = uc?.apis?.find((a: any) => a.keyName === "MembershipApi")?.jwt;
  if (!jwt) throw new Error("MembershipApi JWT not present");
  return { ctx, headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } };
}

async function setDirectoryVisibility(value: string) {
  const { ctx, headers } = await adminHeaders();
  const settings = await (await ctx.get(API + "/membership/settings", { headers })).json();
  const setting = (settings || []).find((x: any) => x.keyName === "directoryVisibility") || { churchId: DEMO_CHURCH.ID, public: 1, keyName: "directoryVisibility" };
  setting.value = value;
  const res = await ctx.post(API + "/membership/settings", { headers, data: [setting] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  await ctx.dispose();
}

async function setMembershipStatus(personId: string, membershipStatus: string) {
  const { ctx, headers } = await adminHeaders();
  const person = await (await ctx.get(`${API}/membership/people/${personId}`, { headers })).json();
  const res = await ctx.post(API + "/membership/people", { headers, data: [{ ...person, membershipStatus }] });
  if (!res.ok()) throw new Error(`person save failed: ${res.status()}`);
  await ctx.dispose();
}

test("a Guest sees the mobile directory when Show in Directory is Everyone", async ({ browser }) => {
  await setDirectoryVisibility("Everyone");
  await setMembershipStatus(RACHEL, "Guest");
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  try {
    await page.goto("/mobile/login");
    await page.locator('input[type="email"]').first().fill("volunteer@b1.church");
    await page.locator('input[type="password"]').first().fill("password");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });
    await page.goto("/mobile/community");
    await expect(page.getByRole("textbox", { name: /Search Members/i })).toBeVisible({ timeout: 30000 });
    await expect(page.locator("main")).toContainText(/Donald/, { timeout: 30000 });
    await expect(page.getByText("Members Only")).toHaveCount(0);
  } finally {
    await context.close();
    await setMembershipStatus(RACHEL, "Member");
    await setDirectoryVisibility("Members");
  }
});
