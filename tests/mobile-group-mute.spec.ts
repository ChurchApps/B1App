import { test, expect, request, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

const API = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
// Rachel Martin (volunteer@b1.church) is a plain member of GRP00000025.
const GROUP = "GRP00000025";
const RACHEL = "PER00000069";

type Mute = { personId?: string; entityType?: string; entityId?: string; level?: string };
type LoginBody = { userChurches?: { church?: { id?: string }; apis?: { keyName?: string; jwt?: string }[] }[] };

async function messagingJwt(ctx: APIRequestContext, email: string): Promise<string> {
  const res = await ctx.post(`${API}/membership/users/login`, { data: { email, password: "password" } });
  if (!res.ok()) throw new Error(`login ${email} failed: ${res.status()}`);
  const uc = (((await res.json()) as LoginBody).userChurches || []).find((c) => c.church?.id === CHURCH_ID);
  const jwt = uc?.apis?.find((a) => a.keyName === "MessagingApi")?.jwt;
  if (!jwt) throw new Error(`MessagingApi JWT not present for ${email}`);
  return jwt;
}

const myMutes = async (ctx: APIRequestContext, jwt: string): Promise<Mute[]> => {
  const res = await ctx.get(`${API}/messaging/reminders/mute?entityType=group`, { headers: { Authorization: `Bearer ${jwt}` } });
  expect(res.ok()).toBeTruthy();
  return res.json();
};

const setLevel = (ctx: APIRequestContext, jwt: string, level: string) =>
  ctx.post(`${API}/messaging/reminders/mute`, { headers: { Authorization: `Bearer ${jwt}` }, data: { entityType: "group", entityId: GROUP, level } });

async function loginAs(page: Page, email: string) {
  await page.goto("/login", { timeout: 60000 });
  await page.locator('input[type="email"]').waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

test.describe("Mute this group", () => {
  test.describe.configure({ mode: "serial" });

  let api: APIRequestContext;
  let rachelJwt: string;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    api = await request.newContext();
    rachelJwt = await messagingJwt(api, "volunteer@b1.church");
    await setLevel(api, rachelJwt, "all");
    context = await browser.newContext({ storageState: undefined });
    page = await context.newPage();
    await loginAs(page, "volunteer@b1.church");
  });

  test.afterAll(async () => {
    await setLevel(api, rachelJwt, "all").catch(() => { /* best effort */ });
    await context?.close();
    await api?.dispose();
  });

  test("a member mutes the group, it sticks across a reload, and unmutes", async () => {
    await page.goto(`/mobile/groups/${GROUP}`, { timeout: 60000 });
    const toggle = page.getByTestId("group-mute-switch").locator("input");
    await expect(toggle).toBeEnabled({ timeout: 30000 });
    await expect(toggle).not.toBeChecked();

    const saved = page.waitForResponse((r) => r.url().includes("/reminders/mute") && r.request().method() === "POST");
    await toggle.click();
    expect((await saved).ok()).toBeTruthy();
    await expect(toggle).toBeChecked();
    expect((await myMutes(api, rachelJwt)).find((m) => m.entityId === GROUP)?.level).toBe("muted");

    await page.reload();
    await expect(toggle).toBeEnabled({ timeout: 30000 });
    await expect(toggle).toBeChecked();

    const unsaved = page.waitForResponse((r) => r.url().includes("/reminders/mute") && r.request().method() === "POST");
    await toggle.click();
    expect((await unsaved).ok()).toBeTruthy();
    await expect(toggle).not.toBeChecked();
    expect((await myMutes(api, rachelJwt)).find((m) => m.entityId === GROUP)?.level).toBe("all");
  });

  test("the mute list holds only the caller's own rows", async () => {
    await setLevel(api, rachelJwt, "muted");
    const demoJwt = await messagingJwt(api, "demo@b1.church");
    const demoRows = await myMutes(api, demoJwt);
    expect(demoRows.some((m) => m.personId === RACHEL)).toBe(false);
    const rachelRows = await myMutes(api, rachelJwt);
    expect(rachelRows.length).toBeGreaterThan(0);
    expect(rachelRows.every((m) => m.personId === RACHEL && m.entityType === "group")).toBe(true);
  });
});
