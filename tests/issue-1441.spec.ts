import { test, expect, request, type APIRequestContext } from "@playwright/test";

// Issue #1441: after sending a join request from a group page, the Groups tab
// kept serving its cached (empty) pending-requests list for up to five minutes.
const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
// demo@b1.church (Demo User) is not a member of GRP00000029 (Financial Peace).
const GROUP_ID = "GRP00000029";
const GROUP_NAME = "Financial Peace";

async function membershipHeaders(ctx: APIRequestContext) {
  const login = await ctx.post(`${MAIN_API}/membership/users/login`, {
    data: { email: "demo@b1.church", password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  expect(login.ok()).toBeTruthy();
  const uc = (await login.json()).userChurches.find((c: any) => c.church?.id === CHURCH_ID);
  const jwt = uc.apis.find((a: any) => a.keyName === "MembershipApi").jwt;
  return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}

async function clearMyRequests(ctx: APIRequestContext, headers: Record<string, string>) {
  const mine: any[] = await (await ctx.get(`${MAIN_API}/membership/groupjoinrequests/my`, { headers })).json();
  for (const r of mine) {
    if (r.groupId === GROUP_ID && r.status === "pending") await ctx.delete(`${MAIN_API}/membership/groupjoinrequests/${r.id}`, { headers });
  }
}

test("a new join request shows under Pending Requests on the Groups tab right away", async ({ page }) => {
  const ctx = await request.newContext();
  const headers = await membershipHeaders(ctx);
  const originalGroup = await (await ctx.get(`${MAIN_API}/membership/groups/${GROUP_ID}`, { headers })).json();
  try {
    const saveRes = await ctx.post(`${MAIN_API}/membership/groups`, { headers, data: [{ ...originalGroup, joinPolicy: "request" }] });
    expect(saveRes.ok()).toBeTruthy();
    await clearMyRequests(ctx, headers);

    // Visit the Groups tab first so its pending-requests list is cached (and persisted) as empty.
    await page.goto("/mobile/groups");
    await expect(page.locator("main")).toContainText(/Sunday Morning Service|Adult Bible Class|Men's Bible Study/i, { timeout: 20000 });
    await expect(page.getByTestId("my-pending-requests")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => new Promise<boolean>((resolve) => {
      const open = indexedDB.open("keyval-store");
      open.onsuccess = () => {
        const get = open.result.transaction("keyval").objectStore("keyval").get("b1-mobile-query-cache");
        get.onsuccess = () => resolve(JSON.stringify(get.result || {}).includes("my-pending-requests"));
        get.onerror = () => resolve(false);
      };
      open.onerror = () => resolve(false);
    })), { timeout: 15000 }).toBe(true);

    await page.goto(`/mobile/groups/${GROUP_ID}`);
    await page.getByTestId("request-to-join-button").click();
    await page.getByTestId("request-submit").click();
    await expect(page.getByTestId("request-pending-notice")).toBeVisible();

    await page.locator("main").getByRole("button", { name: "Back", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/mobile/groups");
    const pending = page.getByTestId("my-pending-requests");
    await expect(pending).toBeVisible();
    await expect(pending).toContainText(GROUP_NAME);
  } finally {
    await clearMyRequests(ctx, headers).catch(() => {});
    if (originalGroup?.id) await ctx.post(`${MAIN_API}/membership/groups`, { headers, data: [originalGroup] }).catch(() => {});
    await ctx.dispose();
  }
});
