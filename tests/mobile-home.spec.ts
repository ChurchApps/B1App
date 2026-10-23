import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { mobileSignedInChrome } from "./helpers/mobile";
import { DEMO_CHURCH } from "./helpers/fixtures";

const API = process.env.API_BASE || "http://localhost:8084";
const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";

// The demo church's nav has no Groups/Plans links, and Home only teases features the church turned on.
test.describe.serial("Mobile home teasers", () => {
  let ctx: APIRequestContext;
  let headers: Record<string, string>;
  let linkIds: string[] = [];

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = login.userChurches.find((c: any) => c.church?.id === "CHU00000001");
    headers = { Authorization: `Bearer ${uc.jwt}` };
    const saved = await (await ctx.post(`${API}/content/links`, {
      headers,
      data: [
        { churchId: "CHU00000001", category: "b1Tab", linkType: "groups", text: "Groups", sort: 20, visibility: "everyone" },
        { churchId: "CHU00000001", category: "b1Tab", linkType: "plans", text: "Plans", sort: 21, visibility: "everyone" }
      ]
    })).json();
    linkIds = saved.map((l: any) => l.id);
  });

  test.afterAll(async () => {
    for (const id of linkIds) await ctx.delete(`${API}/content/links/${id}`, { headers });
    await ctx.dispose();
  });

  test("shows serving, groups and giving previews", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
    const main = page.locator("main");

    await expect(main.getByRole("heading", { name: "You're serving" })).toBeVisible({ timeout: 20000 });
    const serving = page.getByTestId("home-serving-row").first();
    await expect(serving).toContainText("Needs reply");
    await expect(serving.getByRole("button", { name: "Accept" })).toBeVisible();

    await expect(main.getByRole("heading", { name: "Your groups" })).toBeVisible();
    await expect(main.getByRole("link", { name: "All groups" })).toHaveAttribute("href", "/mobile/groups");

    await expect(page.getByTestId("home-giving-total")).toContainText(/\d/);
    await expect(page.getByTestId("home-giving-total")).toContainText(`Given in ${new Date().getFullYear()}`);
  });

  test("shows the next three upcoming events and links to the full list", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
    const events = page.getByRole("region", { name: "Upcoming events" });
    await expect(events).toBeVisible({ timeout: 20000 });
    const rows = events.getByTestId("dashboard-event-row");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeLessThanOrEqual(3);
    await expect(rows.first()).toHaveAttribute("href", /\/mobile\/groups/);

    await events.getByRole("link", { name: "All upcoming events" }).click();
    await expect(page).toHaveURL(/\/mobile\/me\?view=upcoming/, { timeout: 15000 });
    await expect(page.getByRole("button", { name: /Back to Me/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("me-item-event").first()).toBeVisible({ timeout: 15000 });
  });
});

// When the church's app Home has no links yet, signed-out visitors still get the sign-in prompt.
test.describe("Mobile home signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("empty Home still shows the sign-in prompt", async ({ page }) => {
    await page.route(/\/links\/church\/[^/]+\?category=b1Tab/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    await page.goto("/mobile/dashboard");

    const main = page.locator("main");
    await expect(main.getByText("We're just getting set up.", { exact: false })).toBeVisible({ timeout: 20000 });
    await expect(main.getByText("Sign in to see your groups, giving, and more.")).toBeVisible();
    await expect(main.getByRole("link", { name: "Sign In" })).toBeVisible();
  });
});

// ChurchAppsSupport#1331: churches can opt in to the Me tab's My Attendance and My Forms on Home (B1Admin > B1 Mobile).
test.describe.serial("Mobile home attendance and forms", () => {
  let ctx: APIRequestContext;
  let headers: Record<string, string>;
  let submissionId = "";

  const setHomeRecords = async (on: boolean) => {
    const all = (await (await ctx.get(`${API}/membership/settings`, { headers })).json()) as any[];
    const row = (keyName: string) => ({ ...(all.find((s) => s.keyName === keyName) || { churchId: DEMO_CHURCH.ID, keyName }), public: 1, value: `${on}` });
    const res = await ctx.post(`${API}/membership/settings`, { headers, data: [row("mobileHomeAttendance"), row("mobileHomeForms")] });
    expect(res.ok()).toBeTruthy();
    await ctx.post(`${BASE_URL}/api/revalidate/${DEMO_CHURCH.SUBDOMAIN}`);
  };

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = login.userChurches.find((c: any) => c.church?.id === DEMO_CHURCH.ID);
    headers = { Authorization: `Bearer ${uc.jwt}` };
    // Demo User (PER00000082) already has seeded attendance; give them a form submission too.
    const saved = await (await ctx.post(`${API}/membership/formsubmissions`, {
      headers,
      data: [
        {
          formId: "FRM00000004",
          contentType: "form",
          contentId: "FRM00000004",
          submittedBy: "PER00000082",
          submissionDate: new Date().toISOString(),
          answers: [{ questionId: "QST00000013", value: "E2E Home Child" }, { questionId: "QST00000014", value: "(217) 555-0100" }]
        }
      ]
    })).json();
    submissionId = saved?.[0]?.id || "";
  });

  test.afterAll(async () => {
    await setHomeRecords(false);
    if (submissionId) await ctx.delete(`${API}/membership/formsubmissions/${submissionId}`, { headers });
    await ctx.dispose();
  });

  test("stays off Home until the church turns it on", async ({ page }) => {
    await setHomeRecords(false);
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
    await expect(page.getByRole("region", { name: "Upcoming events" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("home-attendance-section")).toHaveCount(0);
    await expect(page.getByTestId("home-forms-section")).toHaveCount(0);
  });

  test("shows the member's attendance and forms on Home when turned on", async ({ page }) => {
    await setHomeRecords(true);
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();

    const attendance = page.getByTestId("home-attendance-section");
    await expect(attendance).toBeVisible({ timeout: 20000 });
    await expect(attendance.getByRole("heading", { name: "My Attendance" })).toBeVisible();
    await expect(attendance.getByText(/times? in the last 90 days/)).toBeVisible();
    await expect(attendance.getByTestId("home-attendance-row").first()).toBeVisible();
    await expect(attendance.getByRole("link", { name: "History" })).toHaveAttribute("href", "/mobile/myAttendance");

    const forms = page.getByTestId("home-forms-section");
    await expect(forms).toBeVisible();
    await expect(forms.getByRole("heading", { name: "My Forms" })).toBeVisible();
    await expect(forms.getByTestId("home-form-row").filter({ hasText: "VBS Registration (Public)" }).first()).toBeVisible();
    await forms.getByRole("link", { name: "All forms" }).click();
    await expect(page).toHaveURL(/\/mobile\/myForms/, { timeout: 15000 });
  });
});
