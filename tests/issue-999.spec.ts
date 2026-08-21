import { test, expect, request, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

const API = "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
// Rachel Martin (volunteer@b1.church) leads GRP00000029 and is a plain member of GRP00000025.
const LED_GROUP = "GRP00000029";
const MEMBER_GROUP = "GRP00000025";
const RACHEL = "PER00000069";
const AMANDA = "PER00000057";
const KEVIN = "PER00000068";

type Seed = { conversationId: string; messageIds: string[] };

async function adminApi(): Promise<{ ctx: APIRequestContext; jwt: string }> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
  if (!res.ok()) throw new Error(`admin login failed: ${res.status()}`);
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID);
  const jwt = uc?.apis?.find((a: any) => a.keyName === "MessagingApi")?.jwt;
  if (!jwt) throw new Error("MessagingApi JWT not present for demo@b1.church");
  return { ctx, jwt };
}

async function seedConversation(ctx: APIRequestContext, jwt: string, groupId: string): Promise<string> {
  const res = await ctx.post(`${API}/messaging/conversations`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: [{ groupId, allowAnonymousPosts: false, contentType: "group", contentId: groupId, title: "issue-999 chat", visibility: "hidden" }]
  });
  if (!res.ok()) throw new Error(`seed conversation failed: ${res.status()}`);
  return (await res.json())[0].id;
}

async function seedMessage(ctx: APIRequestContext, jwt: string, conversationId: string, personId: string, displayName: string, content: string) {
  const res = await ctx.post(`${API}/messaging/messages`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: [{ conversationId, personId, displayName, content }]
  });
  if (!res.ok()) throw new Error(`seed message failed: ${res.status()}`);
  return (await res.json())[0].id as string;
}

async function cleanup(ctx: APIRequestContext, jwt: string, seed: Seed) {
  const headers = { Authorization: `Bearer ${jwt}` };
  for (const id of seed.messageIds) {
    await ctx.delete(`${API}/messaging/messages/${id}`, { headers }).catch(() => { /* already gone */ });
  }
  // The conversation delete route never sends a response body; fire and forget.
  await ctx
    .delete(`${API}/messaging/conversations/${CHURCH_ID}/${seed.conversationId}`, { headers, timeout: 5000 })
    .catch(() => { /* ignore */ });
}

async function loginAs(page: Page, email: string) {
  await page.goto("/login", { timeout: 60000 });
  await page.locator('input[type="email"]').waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

async function openChat(page: Page, groupId: string) {
  await page.goto(`/mobile/groups/${groupId}`, { timeout: 60000 });
  await page.getByRole("tab", { name: /Messages/i }).click();
  await page.locator('[data-testid^="react-add-"]').first().waitFor({ state: "visible", timeout: 30000 });
}

test.describe("Issue 999 — group leaders can delete other members' messages", () => {
  test.describe.configure({ mode: "serial" });

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ storageState: undefined });
    page = await context.newPage();
    await loginAs(page, "volunteer@b1.church");
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("leader gets Delete (not Edit) on a member's message and the delete sticks", async () => {
    const { ctx, jwt } = await adminApi();
    const marker = `issue-999 member post ${Date.now()}`;
    const conversationId = await seedConversation(ctx, jwt, LED_GROUP);
    const seed: Seed = { conversationId, messageIds: [] };
    try {
      const otherId = await seedMessage(ctx, jwt, conversationId, AMANDA, "Amanda Thomas", marker);
      const mineId = await seedMessage(ctx, jwt, conversationId, RACHEL, "Rachel Martin", `issue-999 leader post ${Date.now()}`);
      seed.messageIds.push(otherId, mineId);

      await openChat(page, LED_GROUP);
      await expect(page.getByText(marker)).toBeVisible({ timeout: 15000 });

      // Own message keeps both actions.
      await page.getByTestId(`message-actions-${mineId}`).click();
      await expect(page.getByRole("menuitem", { name: /Edit/i })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /Delete/i })).toBeVisible();
      await page.keyboard.press("Escape");

      // Another member's message: delete only, never edit.
      await page.getByTestId(`message-actions-${otherId}`).click();
      await expect(page.getByRole("menuitem", { name: /Delete/i })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /Edit/i })).toHaveCount(0);
      await page.getByRole("menuitem", { name: /Delete/i }).click();

      const confirm = page.getByRole("dialog").filter({ hasText: /Delete message\?/i });
      await expect(confirm).toBeVisible({ timeout: 5000 });
      await confirm.getByRole("button", { name: /^Delete$/i }).click();

      await expect(page.getByText(marker)).toHaveCount(0, { timeout: 15000 });
    } finally {
      await cleanup(ctx, jwt, seed);
      await ctx.dispose();
    }
  });

  test("plain member gets no action menu on another member's message", async () => {
    const { ctx, jwt } = await adminApi();
    const marker = `issue-999 leader post ${Date.now()}`;
    const conversationId = await seedConversation(ctx, jwt, MEMBER_GROUP);
    const seed: Seed = { conversationId, messageIds: [] };
    try {
      const otherId = await seedMessage(ctx, jwt, conversationId, KEVIN, "Kevin Martin", marker);
      seed.messageIds.push(otherId);

      await openChat(page, MEMBER_GROUP);
      await expect(page.getByText(marker)).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId(`message-actions-${otherId}`)).toHaveCount(0);
    } finally {
      await cleanup(ctx, jwt, seed);
      await ctx.dispose();
    }
  });
});
