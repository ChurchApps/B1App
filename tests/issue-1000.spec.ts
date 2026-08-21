import { test, expect, request, type Page } from "@playwright/test";

const MAIN_API = "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
// volunteer@b1.church (Rachel Martin) is a plain member of GRP00000025 and the leader of GRP00000029
const MEMBER_GROUP = "GRP00000025";
const LEADER_GROUP = "GRP00000029";

test.use({ storageState: { cookies: [], origins: [] } });

async function loginAs(page: Page, email: string) {
  await page.goto("/login", { timeout: 60000 });
  await page.locator('input[type="email"]').waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

const attendanceTab = (page: Page) => page.getByRole("tab", { name: /Attendance/i });

test.describe("Issue 1000 - attendance taking is leaders only", () => {
  test("a plain group member does not get the attendance tab", async ({ page }) => {
    await loginAs(page, "volunteer@b1.church");
    await page.goto(`/mobile/groups/${MEMBER_GROUP}`);
    await expect(page.getByRole("tab", { name: /Members/i })).toBeVisible({ timeout: 20000 });
    await expect(attendanceTab(page)).toHaveCount(0);
  });

  test("a plain group member cannot deep link into attendance", async ({ page }) => {
    const attendanceCalls: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/attendance/")) attendanceCalls.push(r.url());
    });
    await loginAs(page, "volunteer@b1.church");
    await page.goto(`/mobile/groups/${MEMBER_GROUP}?activeTab=attendance`);
    await expect(page.getByRole("tab", { name: /Members/i })).toBeVisible({ timeout: 20000 });
    await expect(attendanceTab(page)).toHaveCount(0);
    expect(attendanceCalls).toEqual([]);
  });

  test("a group leader still gets the attendance tab", async ({ page }) => {
    await loginAs(page, "volunteer@b1.church");
    await page.goto(`/mobile/groups/${LEADER_GROUP}`);
    await expect(attendanceTab(page)).toBeVisible({ timeout: 20000 });
  });

  test("staff without the attendance permission do not get it either", async ({ page }) => {
    const ctx = await request.newContext();
    const login = await ctx.post(`${MAIN_API}/membership/users/login`, {
      data: { email: "demo@b1.church", password: "password" },
      headers: { "Content-Type": "application/json" }
    });
    const uc = (await login.json()).userChurches.find((c: any) => c.church?.id === CHURCH_ID);
    const jwt = uc.apis.find((a: any) => a.keyName === "MembershipApi").jwt;
    const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };

    const roles = await (await ctx.post(`${MAIN_API}/membership/roles`, { headers, data: [{ name: `issue-1000 groups-only ${Date.now()}` }] })).json();
    const roleId = roles[0].id;
    try {
      await ctx.post(`${MAIN_API}/membership/rolepermissions`, {
        headers,
        data: [{ roleId, apiName: "MembershipApi", contentType: "Groups", action: "Edit" }]
      });
      await ctx.post(`${MAIN_API}/membership/rolemembers`, {
        headers,
        data: [{ roleId, user: { email: "volunteer@b1.church" } }]
      });

      await loginAs(page, "volunteer@b1.church");
      await page.goto(`/mobile/groups/${MEMBER_GROUP}`);
      await expect(page.getByRole("tab", { name: /Members/i })).toBeVisible({ timeout: 20000 });
      await expect(attendanceTab(page)).toHaveCount(0);
    } finally {
      await ctx.delete(`${MAIN_API}/membership/roles/${roleId}`, { headers });
      await ctx.dispose();
    }
  });
});
