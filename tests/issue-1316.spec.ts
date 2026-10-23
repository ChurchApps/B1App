import { test, expect, request, type APIRequestContext, type Browser } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// Issue #1316: the "Staff Only" and "My Group Leaders and Staff" contact levels hid the
// fields from the very staff and leaders they name, and Show in Directory's "Staff" tier
// is now Admins Only. Church-wide settings and Donald's record are mutated, so run serially.
test.describe.configure({ mode: "serial" });
test.use({ storageState: { cookies: [], origins: [] } });

const API = process.env.API_BASE || "http://localhost:8084";
const TARGET = "PER00000056"; // Christopher Thomas, a member of Financial Peace (GRP00000029)
const VIEWER = "PER00000080"; // Donald Clark (counter@b1.church): a Member with only donation permissions
const GROUP = "GRP00000029";

let ctx: APIRequestContext;
let headers: Record<string, string>;
const originals = new Map<string, any>();

async function saveSettings(values: Record<string, string>) {
  const all = (await (await ctx.get(`${API}/membership/settings`, { headers })).json()) as any[];
  const rows = Object.entries(values).map(([keyName, value]) => {
    const existing = all.find((s) => s.keyName === keyName);
    if (!originals.has(keyName)) originals.set(keyName, existing?.value ?? null);
    return { ...(existing || { churchId: DEMO_CHURCH.ID, keyName }), public: 1, value };
  });
  const res = await ctx.post(`${API}/membership/settings`, { headers, data: rows });
  expect(res.ok()).toBeTruthy();
}

async function setViewerStatus(status: string) {
  const person = await (await ctx.get(`${API}/membership/people/${VIEWER}`, { headers })).json();
  const res = await ctx.post(`${API}/membership/people`, { headers, data: [{ ...person, membershipStatus: status }] });
  expect(res.ok()).toBeTruthy();
}

async function viewerGroupRow() {
  const rows = (await (await ctx.get(`${API}/membership/groupmembers?groupId=${GROUP}`, { headers })).json()) as any[];
  return rows.find((r) => (r.personId || r.person?.id) === VIEWER);
}

async function signInAsViewer(browser: Browser) {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/mobile/login");
  await page.locator('input[type="email"]').first().fill("counter@b1.church");
  await page.locator('input[type="password"]').first().fill("password");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });
  return { context, page };
}

async function openTarget(page: import("@playwright/test").Page) {
  await page.goto(`/mobile/community/${TARGET}`);
  const main = page.locator("main");
  await expect(main).toContainText("Christopher Thomas", { timeout: 30000 });
  return main;
}

test.beforeAll(async () => {
  ctx = await request.newContext();
  const login = await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
  const body = await login.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID);
  const jwt = uc?.apis?.find((a: any) => a.keyName === "MembershipApi")?.jwt;
  if (!jwt) throw new Error("MembershipApi JWT not present");
  headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
  // Address is staff-only; phone and email reach group leaders and staff.
  await saveSettings({ addressVisibility: "staff", phoneVisibility: "leaders", emailVisibility: "leaders", directoryVisibility: "Members" });
});

test.afterAll(async () => {
  await setViewerStatus("Member");
  const row = await viewerGroupRow();
  if (row) await ctx.delete(`${API}/membership/groupmembers/${row.id}`, { headers });
  const all = (await (await ctx.get(`${API}/membership/settings`, { headers })).json()) as any[];
  const restore = [...originals.entries()].map(([keyName, value]) => ({
    ...all.find((s) => s.keyName === keyName),
    value: value ?? (keyName === "directoryVisibility" ? "Members" : "members")
  }));
  await ctx.post(`${API}/membership/settings`, { headers, data: restore });
  await ctx.dispose();
});

test("a plain member outside the person's groups sees none of the leader/staff-only fields", async ({ browser }) => {
  const { context, page } = await signInAsViewer(browser);
  try {
    const main = await openTarget(page);
    await expect(main.getByText("Contact info not available")).toBeVisible();
    await expect(main).not.toContainText("christopher.thomas@email.com");
    await expect(main).not.toContainText("(217) 555-1602");
    await expect(main).not.toContainText("753 Cedar Court");
  } finally {
    await context.close();
  }
});

test("a leader added after sign-in sees phone and email but not the staff-only address", async ({ browser }) => {
  const { context, page } = await signInAsViewer(browser);
  try {
    // Granted while signed in, so the session's token still lists no groups.
    const res = await ctx.post(`${API}/membership/groupmembers`, { headers, data: [{ groupId: GROUP, personId: VIEWER, leader: true }] });
    expect(res.ok()).toBeTruthy();
    const main = await openTarget(page);
    await expect(main).toContainText("christopher.thomas@email.com", { timeout: 15000 });
    await expect(main).toContainText("(217) 555-1602");
    await expect(main).not.toContainText("753 Cedar Court");
  } finally {
    await context.close();
    const row = await viewerGroupRow();
    if (row) await ctx.delete(`${API}/membership/groupmembers/${row.id}`, { headers });
  }
});

test("a person with Staff membership status (no People View) sees staff-only and leader-only fields", async ({ browser }) => {
  await setViewerStatus("Staff");
  const { context, page } = await signInAsViewer(browser);
  try {
    const main = await openTarget(page);
    await expect(main).toContainText("christopher.thomas@email.com", { timeout: 15000 });
    await expect(main).toContainText("(217) 555-1602");
    await expect(main).toContainText("753 Cedar Court");
    await expect(main.getByText("Contact info not available")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("Show in Directory of Admins Only closes the directory to Staff-status people without People View", async ({ browser }) => {
  await setViewerStatus("Staff");
  await saveSettings({ directoryVisibility: "Staff" });
  const { context, page } = await signInAsViewer(browser);
  try {
    await page.goto("/mobile/community");
    await expect(page.getByText("Members Only")).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("textbox", { name: /Search Members/i })).toHaveCount(0);
    const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: "counter@b1.church", password: "password" } })).json();
    const jwt = (login.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID)?.jwt;
    const res = await ctx.get(`${API}/membership/people/${TARGET}`, { headers: { Authorization: `Bearer ${jwt}` } });
    expect(res.status()).toBe(401);
  } finally {
    await context.close();
    await saveSettings({ directoryVisibility: "Members" });
  }
});
