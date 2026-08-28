import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { waitForRoomJoin } from "./helpers/realtime";

const STREAM_URL = "/stream";

async function openAnonymous(page: Page) {
  await page.context().clearCookies();
  await page.goto(STREAM_URL);
  await page.waitForLoadState("domcontentloaded");
}

async function openAnonymousContext(browser: import("@playwright/test").Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  // Set up room-join waiter before nav; chat container visibility does not guarantee server-side join.
  const joined = waitForRoomJoin(page);
  await page.goto(STREAM_URL);
  await page.waitForLoadState("domcontentloaded");
  await page.locator("#chatSend").waitFor({ state: "visible", timeout: 30000 });
  await joined;
  return { context, page };
}

async function sendChat(page: Page, content: string) {
  const input = page.locator("#sendChatText");
  await input.fill(content);
  await page.locator('[data-testid="send-message-button"]').click();
}

test.describe("Live stream chat — unified delivery migration smoke", () => {
  test("/stream renders for an anonymous viewer with no chat console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await openAnonymous(page);

    await expect(page).toHaveURL(/\/stream/);
    await expect(page.locator("body")).not.toContainText(/404|not found/i);

    await page.waitForTimeout(2000);

    const fatal = errors.filter((m) =>
      /ChatHelper|StreamChatManager|PresenceStore|ConversationStore|SubscriptionManager/i.test(m)
        && !/favicon|404/i.test(m));
    expect(fatal, `Unexpected chat errors: ${fatal.join(" | ")}`).toEqual([]);
  });

  test("anonymous viewer is assigned a 4-digit Anonymous cookie name", async ({ page }) => {
    await openAnonymous(page);
    await page.locator("#chatSend").waitFor({ state: "visible", timeout: 30000 });

    const cookies = await page.context().cookies();
    const display = cookies.find((c) => c.name === "displayName");
    expect(display?.value, "displayName cookie should be present once chat mounts").toBeTruthy();
    expect(display!.value).toMatch(/^Anonymous\d{4}$/);
  });

  test("/stream opens a WebSocket via the unified SocketHelper", async ({ page }) => {
    const sockets: { url: string; sentGetId: boolean }[] = [];
    page.on("websocket", (ws) => {
      const entry = { url: ws.url(), sentGetId: false };
      sockets.push(entry);
      ws.on("framesent", (frame) => {
        if (frame.payload?.toString().includes("getId")) entry.sentGetId = true;
      });
    });

    await openAnonymous(page);
    await page.waitForTimeout(3000);

    const messagingSockets = sockets.filter((s) => /:8087|messaging/i.test(s.url));
    expect(messagingSockets.length, `Expected a MessagingApi WebSocket; saw: ${sockets.map((s) => s.url).join(", ")}`).toBeGreaterThan(0);
    expect(messagingSockets.some((s) => s.sentGetId), "Expected the client to send 'getId' over the socket").toBe(true);
  });

  test("the always-live demo service renders the chat container", async ({ page }) => {
    await openAnonymous(page);
    await expect(page.locator("#chatSend"), "demo data should make /stream render the chat composer").toBeVisible({ timeout: 30000 });
    await expect(page.locator("#chatReceive")).toBeVisible();
  });
});

test.describe("Live stream chat — cross-user realtime", () => {
  test.describe.configure({ mode: "serial" });

  let viewerA: { context: BrowserContext; page: Page };
  let viewerB: { context: BrowserContext; page: Page };

  test.beforeAll(async ({ browser }) => {
    viewerA = await openAnonymousContext(browser);
    viewerB = await openAnonymousContext(browser);
  });

  test.afterAll(async () => {
    await viewerA?.context.close();
    await viewerB?.context.close();
  });

  test("viewer A posts -> viewer B sees it without reload", async () => {
    const stamp = `stream-from-A-${Date.now()}`;
    await sendChat(viewerA.page, stamp);

    await expect(viewerB.page.locator("#chatReceive")).toContainText(stamp, { timeout: 15000 });
    await expect(viewerA.page.locator("#chatReceive")).toContainText(stamp, { timeout: 15000 });

    // Regression: ChatHelper-vs-ConversationStore double-apply.
    const occurrencesA = await viewerA.page.locator("#chatReceive .message", { hasText: stamp }).count();
    const occurrencesB = await viewerB.page.locator("#chatReceive .message", { hasText: stamp }).count();
    expect(occurrencesA, "viewer A should see exactly one copy of their own message").toBe(1);
    expect(occurrencesB, "viewer B should see exactly one copy of A's message").toBe(1);
  });

  test("viewer B replies -> viewer A sees it without reload", async () => {
    const stamp = `stream-from-B-${Date.now()}`;
    await sendChat(viewerB.page, stamp);

    await expect(viewerA.page.locator("#chatReceive")).toContainText(stamp, { timeout: 15000 });
    await expect(viewerB.page.locator("#chatReceive")).toContainText(stamp, { timeout: 15000 });
  });

  test("attendance reflects both viewers", async () => {
    const countLinkA = viewerA.page.locator("#attendanceCount");
    await expect(countLinkA).toBeVisible({ timeout: 15000 });
    await expect(countLinkA, "attendance label should report at least 2 viewers across both contexts").toContainText(/[2-9]\d* attendees/, { timeout: 15000 });

    await countLinkA.click();
    const list = viewerA.page.locator("#attendance");
    await expect(list).toBeVisible();
    const distinctNames = await list.locator("div").count();
    expect(distinctNames, "expanded attendance list should contain at least one viewer entry").toBeGreaterThan(0);
  });
});

const MESSAGING_API = "http://localhost:8084/messaging";
const CHURCH_ID = "CHU00000001";
const DEMO_SERVICE_ID = "STR00000002";
const DEMO_PERSON_ID = "PER00000082";

// The public site only holds auth in memory, so reach /stream through the login redirect
// (a client-side nav) rather than a fresh page.goto that would drop UserHelper.user.
async function loginAndOpenStream(page: Page, email: string, password: string) {
  await page.goto(`/login?returnUrl=${encodeURIComponent(STREAM_URL)}`, { timeout: 60000 });
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/stream/, { timeout: 30000 });
}

// Both tabs mount a ChatSend/ChatReceive with the same ids; scope every locator to the shown tab.
const visibleChat = (page: Page) => page.locator(".chatContainer:visible");

const hostTab = (page: Page) => page.locator("a.streamingTab", { hasText: "Host Chat" });

async function openStreamAsHost(browser: import("@playwright/test").Browser, email: string) {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await loginAndOpenStream(page, email, "password");
  // checkHost awaits the host room join before adding the tab, so a visible tab means the room is joined.
  await hostTab(page).waitFor({ state: "visible", timeout: 45000 });
  return { context, page };
}

async function sendInVisibleChat(page: Page, content: string) {
  const chat = visibleChat(page);
  await chat.locator("#sendChatText").fill(content);
  await chat.locator('[data-testid="send-message-button"]').click();
}

test.describe("Live stream chat — host + authenticated", () => {
  test.describe.configure({ mode: "serial" });

  let demo: { context: BrowserContext; page: Page };
  let tester: { context: BrowserContext; page: Page };

  test.beforeAll(async ({ browser }) => {
    demo = await openStreamAsHost(browser, "demo@b1.church");
    tester = await openStreamAsHost(browser, "tester@b1.church");
  });

  test.afterAll(async () => {
    await demo?.context.close();
    await tester?.context.close();
  });

  test("host posts in Host Chat -> other host sees it", async () => {
    await hostTab(demo.page).click();
    await hostTab(tester.page).click();

    const stamp = `host-chat-${Date.now()}`;
    await sendInVisibleChat(demo.page, stamp);

    await expect(visibleChat(tester.page).locator("#chatReceive")).toContainText(stamp, { timeout: 15000 });
    await expect(visibleChat(demo.page).locator("#chatReceive")).toContainText(stamp, { timeout: 15000 });
  });

  test("logged-in viewer's public post carries personId", async ({ request }) => {
    await demo.page.locator("a.streamingTab").first().click();

    const stamp = `auth-public-${Date.now()}`;
    await sendInVisibleChat(demo.page, stamp);
    await expect(visibleChat(demo.page).locator("#chatReceive")).toContainText(stamp, { timeout: 15000 });

    const convRes = await request.get(`${MESSAGING_API}/conversations/current/${CHURCH_ID}/streamingLive/${DEMO_SERVICE_ID}`);
    expect(convRes.ok(), `conversations/current failed: ${convRes.status()}`).toBe(true);
    const conversationId = (await convRes.json()).id;

    const catchupRes = await request.get(`${MESSAGING_API}/messages/catchup/${CHURCH_ID}/${conversationId}`);
    expect(catchupRes.ok(), `catchup failed: ${catchupRes.status()}`).toBe(true);
    const saved = (await catchupRes.json()).find((m: { content?: string }) => m.content === stamp);
    expect(saved, `stamped message ${stamp} should be persisted`).toBeTruthy();
    expect(saved.personId, "authenticated send should stamp the sender's personId").toBe(DEMO_PERSON_ID);
  });
});

test.describe("Live stream chat — chat window", () => {
  // The window is computed client-side from the service row, so shift the clock instead of the data.
  // Backwards: the demo services' chat windows are still upcoming, which is the "Chat opens at" state.
  test("composer is replaced by a notice while the chat window is closed", async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    // setFixedTime (not install) keeps timers running, so the socket keepalive is unaffected.
    await page.clock.setFixedTime(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    await page.goto(STREAM_URL, { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("#chatClosed")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#chatClosed")).toContainText("Chat opens at");
    await expect(page.locator("#sendChatText")).toHaveCount(0);
    await expect(page.locator("#chatReceive")).toBeVisible();

    await page.screenshot({ path: ".pr-screenshots/after.png", fullPage: false });
    await context.close();
  });
});
