import { test, expect, request, type Page, type APIRequestContext } from "@playwright/test";

type Row = { id: string; groupId?: string; status?: string; personId?: string; person?: { id?: string } };

const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
// volunteer@b1.church (Rachel Martin) leads GRP00000029 (Financial Peace); demo@b1.church (Demo User) is not a member of it.
const GROUP_ID = "GRP00000029";

async function loginAs(page: Page, email: string) {
  await page.goto("/login", { timeout: 60000 });
  await page.locator('input[type="email"]').waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

async function membershipHeaders(ctx: APIRequestContext, email: string) {
  const login = await ctx.post(`${MAIN_API}/membership/users/login`, {
    data: { email, password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  expect(login.ok()).toBeTruthy();
  const uc = (await login.json()).userChurches.find((c: { church?: { id?: string } }) => c.church?.id === CHURCH_ID);
  const jwt = uc.apis.find((a: { keyName: string }) => a.keyName === "MembershipApi").jwt;
  return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}

async function clearPending(ctx: APIRequestContext, headers: Record<string, string>) {
  const mine: Row[] = await (await ctx.get(`${MAIN_API}/membership/groupjoinrequests/my`, { headers })).json();
  for (const r of mine) {
    if (r.groupId === GROUP_ID && r.status === "pending") await ctx.delete(`${MAIN_API}/membership/groupjoinrequests/${r.id}`, { headers });
  }
}

async function removeMember(ctx: APIRequestContext, headers: Record<string, string>, personId: string) {
  const members: Row[] = await (await ctx.get(`${MAIN_API}/membership/groupmembers?groupId=${GROUP_ID}`, { headers })).json();
  for (const m of members) {
    if ((m.personId || m.person?.id) === personId) await ctx.delete(`${MAIN_API}/membership/groupmembers/${m.id}`, { headers });
  }
}

test.describe("Mobile groups — leader reviews join requests", () => {
  // Both tests change demo@b1.church's request and membership for Financial Peace.
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: { cookies: [], origins: [] } });

  const run = async (page: Page, action: "approve" | "decline") => {
    const ctx = await request.newContext();
    const headers = await membershipHeaders(ctx, "demo@b1.church");
    const originalGroup = await (await ctx.get(`${MAIN_API}/membership/groups/${GROUP_ID}`, { headers })).json();
    let personId = "";
    try {
      expect((await ctx.post(`${MAIN_API}/membership/groups`, { headers, data: [{ ...originalGroup, joinPolicy: "request" }] })).ok()).toBeTruthy();
      await clearPending(ctx, headers);
      const reqRes = await ctx.post(`${MAIN_API}/membership/groupjoinrequests`, { headers, data: { groupId: GROUP_ID, message: "I'd like to join" } });
      expect(reqRes.ok()).toBeTruthy();
      const joinRequest = await reqRes.json();
      personId = joinRequest.personId;

      await loginAs(page, "volunteer@b1.church");
      await page.goto(`/mobile/groups/${GROUP_ID}`);
      const row = page.getByTestId(`join-request-${joinRequest.id}`);
      await expect(row).toBeVisible({ timeout: 20000 });
      await expect(row).toContainText("Demo User");
      await expect(row).toContainText("I'd like to join");

      await page.getByTestId(`${action}-request-${joinRequest.id}`).click();
      await expect(row).toHaveCount(0);

      await page.getByTestId("group-all-members").click();
      const memberRow = page.locator("main").getByRole("link", { name: /Demo User/ });
      if (action === "approve") await expect(memberRow).toBeVisible({ timeout: 15000 });
      else await expect(memberRow).toHaveCount(0);
    } finally {
      await clearPending(ctx, headers).catch(() => {});
      if (personId) await removeMember(ctx, headers, personId).catch(() => {});
      if (originalGroup?.id) await ctx.post(`${MAIN_API}/membership/groups`, { headers, data: [originalGroup] }).catch(() => {});
      await ctx.dispose();
    }
  };

  test("approving a request adds the person to the member list", async ({ page }) => {
    await run(page, "approve");
  });

  test("declining a request removes it without adding a member", async ({ page }) => {
    await run(page, "decline");
  });
});
