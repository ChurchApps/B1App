import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { mobileSignedInChrome } from "./helpers/mobile";

// Forms linked to a group (ChurchAppsSupport#1309): members fill them out from the group page,
// and the group's leaders read and print the answers. Community Service Team is led by Demo User;
// Donald Clark (counter@b1.church) joins it here as a plain member.
const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000023";
const FORM_NAME = "Outreach Activity Report";
const QUESTION = "People reached";
const MEMBER_EMAIL = "counter@b1.church";
const MEMBER_PERSON_ID = "PER00000080";
const MEMBER_NAME = "Donald Clark";

async function membershipHeaders(ctx: APIRequestContext, email: string) {
  const login = await ctx.post(`${MAIN_API}/membership/users/login`, {
    data: { email, password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  expect(login.ok()).toBeTruthy();
  const uc = (await login.json()).userChurches.find((c: any) => c.church?.id === CHURCH_ID);
  const jwt = uc.apis.find((a: any) => a.keyName === "MembershipApi")?.jwt || uc.jwt;
  return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}

test.describe("Group forms", () => {
  test.describe.configure({ mode: "serial" });
  let ctx: APIRequestContext;
  let admin: Record<string, string>;
  let formId = "";
  let groupMemberId = "";

  test.beforeAll(async () => {
    ctx = await request.newContext();
    admin = await membershipHeaders(ctx, "demo@b1.church");
    const forms = await (await ctx.post(`${MAIN_API}/membership/forms`, { headers: admin, data: [{ name: FORM_NAME, contentType: "form", restricted: false, groupId: GROUP_ID }] })).json();
    formId = forms[0].id;
    await ctx.post(`${MAIN_API}/membership/questions`, { headers: admin, data: [{ formId, fieldType: "Textbox", title: QUESTION, required: false }] });
    const joined = await (await ctx.post(`${MAIN_API}/membership/groupmembers`, { headers: admin, data: [{ groupId: GROUP_ID, personId: MEMBER_PERSON_ID, leader: false }] })).json();
    groupMemberId = joined[0].id;
    const questions = await (await ctx.get(`${MAIN_API}/membership/questions/unrestricted?formId=${formId}`)).json();
    const member = await membershipHeaders(ctx, MEMBER_EMAIL);
    const sub = await ctx.post(`${MAIN_API}/membership/formsubmissions`, {
      headers: member,
      data: [{ formId, contentType: "form", contentId: formId, answers: [{ questionId: questions[0].id, value: "12" }] }]
    });
    expect(sub.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    if (formId) await ctx.delete(`${MAIN_API}/membership/forms/${formId}`, { headers: admin });
    if (groupMemberId) await ctx.delete(`${MAIN_API}/membership/groupmembers/${groupMemberId}`, { headers: admin });
    await ctx.dispose();
  });

  test("a member sees the linked form with Fill out, but no answers", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto("/mobile/login");
    await page.locator('input[type="email"]').first().fill(MEMBER_EMAIL);
    await page.locator('input[type="password"]').first().fill("password");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });
    await expect(mobileSignedInChrome(page)).toBeVisible({ timeout: 20000 });

    await page.goto(`/mobile/groups/${GROUP_ID}`);
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: /^Forms$/ })).toBeVisible({ timeout: 15000 });
    const row = main.getByTestId("group-form-row").filter({ hasText: FORM_NAME });
    await expect(row).toBeVisible();
    await expect(row).not.toContainText(/answer/i);
    const fill = main.getByTestId(`group-form-fill-${formId}`);
    await expect(fill).toHaveAttribute("href", `/forms/${formId}`);
    await fill.click();
    await expect(page.getByLabel(QUESTION)).toBeVisible({ timeout: 30000 });
    await context.close();
  });

  test("a leader reads and can print the answers from the group page", async ({ page }) => {
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    const main = page.locator("main");
    const row = main.getByTestId("group-form-row").filter({ hasText: FORM_NAME });
    await expect(row).toContainText("1 answer", { timeout: 15000 });
    await row.click();
    await expect(page).toHaveURL(/view=forms/);
    await expect(main.getByRole("heading", { name: FORM_NAME })).toBeVisible();
    await main.getByTestId("group-form-submission").filter({ hasText: MEMBER_NAME }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByTestId("group-form-answers")).toContainText(QUESTION);
    await expect(dialog.getByTestId("group-form-answers")).toContainText("12");
    await expect(dialog.getByTestId("group-form-print")).toBeVisible();
  });
});
