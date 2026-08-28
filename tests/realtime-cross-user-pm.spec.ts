import { test, expect, request, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { waitForAlertsJoin } from "./helpers/realtime";

/** Tests cross-user realtime PM delivery via SubscriptionManager broadcast; uses two fresh contexts for isolated auth. */

const DEMO_PERSON_ID = "PER00000082";
const TESTER_PERSON_ID = "PER00000083";
const MAIN_API = "http://localhost:8084";
const CHURCH_ID = "CHU00000001";

async function messagingApi(email: string) {
  const ctx = await request.newContext();
  const res = await ctx.post(`${MAIN_API}/membership/users/login`, { data: { email, password: "password" } });
  if (!res.ok()) throw new Error(`login ${email} failed: ${res.status()}`);
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: { church?: { id?: string } }) => c.church?.id === CHURCH_ID);
  const jwt = (uc?.apis || []).find((a: { keyName?: string }) => a.keyName === "MessagingApi")?.jwt;
  if (!jwt) throw new Error(`MessagingApi JWT missing for ${email}`);
  return { ctx, jwt };
}

type Handle = Awaited<ReturnType<typeof messagingApi>>;
const apiGet = (h: Handle, path: string) => h.ctx.get(`${MAIN_API}/messaging${path}`, { headers: { Authorization: `Bearer ${h.jwt}` } });

async function notificationMessages(h: Handle): Promise<string[]> {
  const res = await apiGet(h, "/notifications/my");
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((n: { id?: string; message?: string }) => `${n.id}|${n.message}`).sort();
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login", { timeout: 60000 });
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

async function openThreadTo(page: Page, otherPersonId: string) {
  await page.goto(`/mobile/messages/${otherPersonId}`, { timeout: 60000 });
  const composer = page.getByPlaceholder(/Type (a|your) message/i).first();
  await composer.waitFor({ state: "visible", timeout: 30000 });
  return composer;
}

async function send(page: Page, content: string) {
  const composer = page.getByPlaceholder(/Type (a|your) message/i).first();
  await composer.fill(content);
  await composer.press("Enter");
}

test.describe("Realtime — cross-user private messages", () => {
  test.describe.configure({ mode: "serial" });

  let demoContext: BrowserContext;
  let testerContext: BrowserContext;
  let demoPage: Page;
  let testerPage: Page;

  test.beforeAll(async ({ browser }) => {
    demoContext = await browser.newContext({ storageState: undefined });
    testerContext = await browser.newContext({ storageState: undefined });
    demoPage = await demoContext.newPage();
    testerPage = await testerContext.newPage();

    await Promise.all([
      loginAs(demoPage, "demo@b1.church", "password"),
      loginAs(testerPage, "tester@b1.church", "password")
    ]);
  });

  test.afterAll(async () => {
    await demoContext?.close();
    await testerContext?.close();
  });

  test("demo -> tester message appears live without reload", async () => {
    const demoAlertsJoined = waitForAlertsJoin(demoPage);
    const testerAlertsJoined = waitForAlertsJoin(testerPage);

    await openThreadTo(demoPage, TESTER_PERSON_ID);
    await openThreadTo(testerPage, DEMO_PERSON_ID);

    await Promise.all([demoAlertsJoined, testerAlertsJoined]);

    const stamp = `from-demo-${Date.now()}`;
    await send(demoPage, stamp);

    await expect(testerPage.locator("body")).toContainText(stamp, { timeout: 15000 });
    await expect(demoPage.locator("body")).toContainText(stamp, { timeout: 15000 });
  });

  test("tester -> demo reply appears live without reload, and notifies exactly once", async () => {
    // The DM itself is delivered as a contentType "privateMessage" row, which the notifications list
    // route deliberately hides; what must not appear is a second, generic "New Private Message" row.
    const demoApi = await messagingApi("demo@b1.church");
    const testerApi = await messagingApi("tester@b1.church");
    const before = { demo: await notificationMessages(demoApi), tester: await notificationMessages(testerApi) };

    const stamp = `from-tester-${Date.now()}`;
    await send(testerPage, stamp);

    await expect(demoPage.locator("body")).toContainText(stamp, { timeout: 15000 });
    await expect(testerPage.locator("body")).toContainText(stamp, { timeout: 15000 });

    // notifyUser was fire-and-forget; give the old code every chance to write its extra row.
    await demoPage.waitForTimeout(2000);
    const after = { demo: await notificationMessages(demoApi), tester: await notificationMessages(testerApi) };
    expect(after.demo).toEqual(before.demo);
    expect(after.tester).toEqual(before.tester);
    expect([...after.demo, ...after.tester].join(" ")).not.toContain("New Private Message");

    await demoApi.ctx.dispose();
    await testerApi.ctx.dispose();
  });

  test("inbox shows preview, time and unread; opening one thread leaves others unread", async ({ browser }) => {
    // Park demo off the thread so the open-thread read receipt does not clear the unread flag.
    await demoPage.goto("/mobile", { timeout: 60000 });

    const stamp1 = `tester-inbox-${Date.now()}`;
    await openThreadTo(testerPage, DEMO_PERSON_ID);
    await send(testerPage, stamp1);
    await expect(testerPage.locator("body")).toContainText(stamp1, { timeout: 15000 });

    const volunteerContext = await browser.newContext({ storageState: undefined });
    const volunteerPage = await volunteerContext.newPage();
    const stamp2 = `volunteer-inbox-${Date.now()}`;
    try {
      await loginAs(volunteerPage, "volunteer@b1.church", "password");
      await openThreadTo(volunteerPage, DEMO_PERSON_ID);
      await send(volunteerPage, stamp2);
      await expect(volunteerPage.locator("body")).toContainText(stamp2, { timeout: 15000 });
    } finally {
      await volunteerContext.close();
    }

    await demoPage.goto("/mobile/messages", { timeout: 60000 });
    const rows = demoPage.locator("[data-testid^=conversation-row-]");
    const dots = demoPage.locator("[data-testid^=conversation-unread-]");
    const unreadIn = (row: Locator) => row.locator("[data-testid^=conversation-unread-]");

    // Preview text is what identifies each row; the demo seed ships its own DM threads, so assert on
    // these two rows and on the delta rather than on a global unread count.
    const testerRow = rows.filter({ hasText: stamp1 });
    const volunteerRow = rows.filter({ hasText: stamp2 });
    await expect(testerRow).toHaveCount(1, { timeout: 30000 });
    await expect(volunteerRow).toHaveCount(1, { timeout: 30000 });
    await expect(unreadIn(testerRow)).toHaveCount(1);
    await expect(unreadIn(volunteerRow)).toHaveCount(1);
    // Relative time renders next to the name on every row.
    await expect(testerRow).toContainText(/now|\d+[hd]|yesterday|\d{4}/i);
    const dotsBefore = await dots.count();

    await testerRow.click();
    await demoPage.getByPlaceholder(/Type (a|your) message/i).first().waitFor({ state: "visible", timeout: 30000 });
    await expect(demoPage.locator("body")).toContainText(stamp1, { timeout: 15000 });

    await demoPage.goBack();
    await expect(unreadIn(testerRow)).toHaveCount(0, { timeout: 30000 });
    await expect(unreadIn(volunteerRow)).toHaveCount(1);
    // Only the thread that was opened flipped to read.
    await expect(dots).toHaveCount(dotsBefore - 1);

    // getAll is a pure read: calling it twice must not change anyone's unread state.
    const demoApi = await messagingApi("demo@b1.church");
    try {
      const notifyState = async () => {
        const res = await apiGet(demoApi, "/privatemessages");
        const rowsJson = await res.json();
        return (rowsJson as { id: string; notifyPersonId: string | null }[])
          .map((pm) => `${pm.id}|${pm.notifyPersonId}`)
          .sort();
      };
      const first = await notifyState();
      const second = await notifyState();
      expect(second).toEqual(first);
    } finally {
      await demoApi.ctx.dispose();
    }
  });
});
