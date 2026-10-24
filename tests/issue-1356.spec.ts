import { test, expect, request, type APIRequestContext } from "@playwright/test";

// ChurchAppsSupport#1356: (1) a submission an admin moves from Anonymous to a member never reached that
// member's My Forms; (2) printing a long answer set left the letterhead alone on page one.
const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000023";
const MEMBER_EMAIL = "counter@b1.church";
const MEMBER_PERSON_ID = "PER00000080";
const ASSIGNED_FORM = "Issue 1356 Assigned Form";
const PRINT_FORM = "Issue 1356 Volunteer Survey";

async function membershipHeaders(ctx: APIRequestContext, email: string) {
  const login = await ctx.post(`${MAIN_API}/membership/users/login`, { data: { email, password: "password" }, headers: { "Content-Type": "application/json" } });
  expect(login.ok()).toBeTruthy();
  const uc = (await login.json()).userChurches.find((c: any) => c.church?.id === CHURCH_ID);
  const jwt = uc.apis.find((a: any) => a.keyName === "MembershipApi")?.jwt || uc.jwt;
  return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}

async function createForm(ctx: APIRequestContext, admin: Record<string, string>, name: string, questionCount: number, groupId?: string) {
  const forms = await (await ctx.post(`${MAIN_API}/membership/forms`, { headers: admin, data: [{ name, contentType: "form", restricted: false, groupId }] })).json();
  const formId = forms[0].id;
  const questions = Array.from({ length: questionCount }, (_, i) => ({ formId, fieldType: "Textbox", title: `Question ${i + 1}: what would you like us to know?`, required: false, sort: i + 1 }));
  await ctx.post(`${MAIN_API}/membership/questions`, { headers: admin, data: questions });
  const saved = await (await ctx.get(`${MAIN_API}/membership/questions/unrestricted?formId=${formId}`)).json();
  return { formId, questions: saved as any[] };
}

test.describe("Issue 1356", () => {
  let ctx: APIRequestContext;
  let admin: Record<string, string>;
  const formIds: string[] = [];

  test.beforeAll(async () => {
    ctx = await request.newContext();
    admin = await membershipHeaders(ctx, "demo@b1.church");
  });

  test.afterAll(async () => {
    for (const id of formIds) await ctx.delete(`${MAIN_API}/membership/forms/${id}`, { headers: admin });
    await ctx.dispose();
  });

  test("a submission an admin assigns to a member shows in their My Forms", async ({ browser }) => {
    const { formId, questions } = await createForm(ctx, admin, ASSIGNED_FORM, 1);
    formIds.push(formId);
    const sub = await ctx.post(`${MAIN_API}/membership/formsubmissions`, {
      headers: { "Content-Type": "application/json" },
      data: [{ formId, contentType: "form", contentId: formId, answers: [{ questionId: questions[0].id, value: "Anonymous answer" }] }]
    });
    expect(sub.ok()).toBeTruthy();
    const submissionId = (await sub.json())[0].id;
    const moved = await ctx.post(`${MAIN_API}/membership/formsubmissions/${submissionId}/person`, { headers: admin, data: { personId: MEMBER_PERSON_ID } });
    expect(moved.ok()).toBeTruthy();

    const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto("/mobile/login");
    await page.locator('input[type="email"]').first().fill(MEMBER_EMAIL);
    await page.locator('input[type="password"]').first().fill("password");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });
    await page.goto("/mobile/myForms");
    await expect(page.locator("main").getByTestId("my-form-row").filter({ hasText: ASSIGNED_FORM })).toBeVisible({ timeout: 20000 });
    await context.close();
  });

  test("printed answers start on the first page under the letterhead", async ({ page }) => {
    const { formId, questions } = await createForm(ctx, admin, PRINT_FORM, 30, GROUP_ID);
    formIds.push(formId);
    const answers = questions.map((q, i) => ({ questionId: q.id, value: `Answer ${i + 1}` }));
    const sub = await ctx.post(`${MAIN_API}/membership/formsubmissions`, { headers: admin, data: [{ formId, contentType: "form", contentId: formId, answers }] });
    expect(sub.ok()).toBeTruthy();

    // Capture the print frame's whole document instead of opening the print dialog.
    await page.addInitScript(() => {
      window.print = function () { (window.top as any).__printed = document.documentElement.outerHTML; };
    });
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    const main = page.locator("main");
    await main.getByTestId("group-form-row").filter({ hasText: PRINT_FORM }).click({ timeout: 20000 });
    await main.getByTestId("group-form-submission").first().click();
    await page.getByRole("dialog").getByTestId("group-form-print").click();
    await expect.poll(() => page.evaluate(() => (window as any).__printed || ""), { timeout: 10000 }).toContain("Answer 30");
    const html: string = await page.evaluate(() => (window as any).__printed);

    // Lay the printout out on Letter paper and check which page the first answer lands on.
    const printPage = await page.context().newPage();
    await printPage.setContent(html.replace(/<img[^>]*>/g, ""));
    const pdf = await printPage.pdf({ format: "Letter", margin: { top: "0", bottom: "0", left: "0", right: "0" } });
    await printPage.close();
    const pdfPages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
    // 30 short answers plus the heading run a little over one Letter page; a gap under the heading makes it three.
    expect(pdfPages, `printout took ${pdfPages} pages`).toBe(2);
  });
});
