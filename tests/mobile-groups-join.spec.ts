import { test, expect, request, type Page, type APIRequestContext } from "@playwright/test";

const MAIN_API = "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
// volunteer@b1.church (Rachel Martin) leads GRP00000029 (Financial Peace); demo@b1.church (Demo User) is not a member of it.
const LEADER_GROUP_ID = "GRP00000029";
const LEADER_GROUP_NAME = "Financial Peace";

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
  const uc = (await login.json()).userChurches.find((c: any) => c.church?.id === CHURCH_ID);
  const jwt = uc.apis.find((a: any) => a.keyName === "MembershipApi").jwt;
  return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}

test.describe("Mobile groups — request-to-join UX", () => {
  const NON_MEMBER_GROUP_ID = "GRP00000005";

  test("non-member sees join button on an open-policy group", async ({ page }) => {
    await page.goto(`/mobile/groups/${NON_MEMBER_GROUP_ID}`);
    await expect(page.getByRole("tab", { name: /About/i })).toBeVisible({ timeout: 15000 });
    const joinBtn = page.locator('[data-testid="join-group-button"]');
    await expect(joinBtn).toBeVisible({ timeout: 10000 });
    await expect(joinBtn).toHaveText(/Join Group/i);
  });

  test("my-groups page renders a pending-requests slot even when empty", async ({ page }) => {
    await page.goto("/mobile/groups");
    await expect(page.locator("main")).toContainText(/Sunday Morning Service|Adult Bible Class|Men's Bible Study/i, { timeout: 15000 });
    await expect(page.locator('[data-testid="my-pending-requests"]')).toHaveCount(0);
  });

  test.describe("leader notification for an incoming join request", () => {
    // This block logs in as the group leader, so start from a clean session
    // instead of the shared demo-user storage state used above.
    test.use({ storageState: { cookies: [], origins: [] } });

    test("clicking the join-request notification opens the group page", async ({ page }) => {
      const ctx = await request.newContext();
      let headers: Record<string, string> | undefined;
      let originalGroup: any;
      let requestId: string | undefined;
      try {
        headers = await membershipHeaders(ctx, "demo@b1.church");

        originalGroup = await (await ctx.get(`${MAIN_API}/membership/groups/${LEADER_GROUP_ID}`, { headers })).json();
        const saveRes = await ctx.post(`${MAIN_API}/membership/groups`, { headers, data: [{ ...originalGroup, joinPolicy: "request" }] });
        expect(saveRes.ok()).toBeTruthy();

        const mine: any[] = await (await ctx.get(`${MAIN_API}/membership/groupjoinrequests/my`, { headers })).json();
        for (const r of mine) {
          if (r.groupId === LEADER_GROUP_ID && r.status === "pending") await ctx.delete(`${MAIN_API}/membership/groupjoinrequests/${r.id}`, { headers });
        }

        const reqRes = await ctx.post(`${MAIN_API}/membership/groupjoinrequests`, {
          headers,
          data: { groupId: LEADER_GROUP_ID, message: "issue-1048 repro" }
        });
        expect(reqRes.ok()).toBeTruthy();
        requestId = (await reqRes.json())?.id;

        await loginAs(page, "volunteer@b1.church");
        await page.goto("/mobile/notifications");
        const row = page.getByText(new RegExp(`Demo User requested to join ${LEADER_GROUP_NAME}`, "i")).first();
        await expect(row).toBeVisible({ timeout: 20000 });
        await row.click();
        // Generous timeout: the group-detail route may cold-compile on first hit in dev.
        await page.waitForURL((url) => url.pathname.includes(`/mobile/groups/${LEADER_GROUP_ID}`), { timeout: 45000 });
      } finally {
        if (headers) {
          if (requestId) await ctx.delete(`${MAIN_API}/membership/groupjoinrequests/${requestId}`, { headers }).catch(() => {});
          if (originalGroup?.id) await ctx.post(`${MAIN_API}/membership/groups`, { headers, data: [originalGroup] }).catch(() => {});
        }
        await ctx.dispose();
      }
    });
  });
});
