import { test, expect, request, type APIRequestContext } from "@playwright/test";

const API = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
// Adult Bible Class: demo@b1.church is a member.
const GROUP_ID = "GRP00000004";
const AMANDA = "PER00000057";

// A sender's avatar and name in group chat open their directory card, the way private messages do.
test.describe("Mobile group chat sender links", () => {
  let ctx: APIRequestContext;
  let headers: Record<string, string>;
  let conversationId = "";
  let messageId = "";
  const marker = `sender-link post ${Date.now()}`;

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const login = await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
    expect(login.ok()).toBeTruthy();
    const uc = ((await login.json()).userChurches || []).find((c: any) => c.church?.id === CHURCH_ID);
    headers = { Authorization: `Bearer ${uc.apis.find((a: any) => a.keyName === "MessagingApi").jwt}` };
    const conv = await ctx.post(`${API}/messaging/conversations`, {
      headers,
      data: [{ groupId: GROUP_ID, allowAnonymousPosts: false, contentType: "group", contentId: GROUP_ID, title: "sender-link chat", visibility: "hidden" }]
    });
    expect(conv.ok()).toBeTruthy();
    conversationId = (await conv.json())[0].id;
    const msg = await ctx.post(`${API}/messaging/messages`, { headers, data: [{ conversationId, personId: AMANDA, displayName: "Amanda Thomas", content: marker }] });
    expect(msg.ok()).toBeTruthy();
    messageId = (await msg.json())[0].id;
  });

  test.afterAll(async () => {
    if (messageId) await ctx.delete(`${API}/messaging/messages/${messageId}`, { headers }).catch(() => { /* already gone */ });
    // The conversation delete route never sends a response body; fire and forget.
    if (conversationId) await ctx.delete(`${API}/messaging/conversations/${CHURCH_ID}/${conversationId}`, { headers, timeout: 5000 }).catch(() => { /* ignore */ });
    await ctx?.dispose();
  });

  test("tapping a sender's name opens their profile", async ({ page }) => {
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    await page.getByTestId("group-open-chat").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(marker)).toBeVisible({ timeout: 30000 });

    const avatar = dialog.locator(`[data-testid="group-chat-sender-avatar"][href="/mobile/community/${AMANDA}"]`).first();
    await expect(avatar).toBeVisible();
    const name = dialog.locator(`[data-testid="group-chat-sender-name"][href="/mobile/community/${AMANDA}"]`).first();
    await expect(name).toHaveText("Amanda Thomas");

    await name.click();
    await expect(page).toHaveURL(new RegExp(`/mobile/community/${AMANDA}$`), { timeout: 15000 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
