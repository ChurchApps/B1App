import { test, expect, type BrowserContext, type Page } from "@playwright/test";

// E2E for the live stream chat against the unified delivery framework.
// Relies on STR00000002 (always-on test service) seeded in
// Api/tools/dbScripts/content/demo.sql.

const STREAM_URL = "/stream";

async function openAnonymous(page: Page) {
  await page.context().clearCookies();
  await page.goto(STREAM_URL);
  await page.waitForLoadState("domcontentloaded");
}

async function openAnonymousContext(browser: import("@playwright/test").Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto(STREAM_URL);
  await page.waitForLoadState("domcontentloaded");
  // Wait for the chat container to mount (proves the WebSocket bootstrap +
  // joinMainRoom + ConversationStore subscription completed).
  await page.locator("#chatSend").waitFor({ state: "visible", timeout: 30000 });
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

    // Allow the chat bootstrap (SocketHelper.init + ensureHandlers) to run.
    await page.waitForTimeout(2000);

    const fatal = errors.filter((m) =>
      /ChatHelper|StreamChatManager|PresenceStore|ConversationStore|SubscriptionManager/i.test(m)
        && !/favicon|404/i.test(m)
    );
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
    // Let both connections register and the server attendance broadcast settle.
    await viewerA.page.waitForTimeout(1500);
    await viewerB.page.waitForTimeout(1500);
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

    // Guard against the ChatHelper-vs-ConversationStore double-apply regression:
    // the same message must land exactly once in each viewer's DOM.
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
    // Both viewers' attendance widgets read from the same PresenceStore snapshot,
    // which gets refreshed every time the server's ConnectionController emits an
    // attendance broadcast on a new join. Click the count to expand the list and
    // confirm at least 2 distinct anonymous names appear.
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
