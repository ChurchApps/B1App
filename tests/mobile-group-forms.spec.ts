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
const CHURCH_NAME = "Grace Community Church";
const LOGO = "/images/logo.png";
// #1352: a full-sentence question took the whole label column and left the answer one letter wide.
const LONG_FORM_NAME = "Ministry Phone Agreement";
const LONG_QUESTION = "I understand the ministry phone is not my personal property and must be returned when I leave the role.";
const LONG_ANSWER = "Derrick Gyamfi — Elder Leader Pastor";
// #1356: a long answer set left the letterhead alone on page one of the printout.
const PRINT_FORM_NAME = "Volunteer Survey Printout";

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
  // The logoLight setting row as it was before the letterhead test set one; null when there was none.
  let originalLogo: any = undefined;

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
    if (originalLogo !== undefined) {
      const current = ((await (await ctx.get(`${MAIN_API}/membership/settings`, { headers: admin })).json()) as any[]).find((s) => s.keyName === "logoLight");
      if (originalLogo) await ctx.post(`${MAIN_API}/membership/settings`, { headers: admin, data: [{ ...current, ...originalLogo }] });
      else if (current?.id) await ctx.delete(`${MAIN_API}/membership/settings/${current.id}`, { headers: admin });
    }
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

  test("on a phone a long question leaves the answer the sheet's width, and the printout has a centered letterhead", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // The demo church has no logo; give it one. config.appearance is server-rendered, so a route mock would not reach the page.
    const settings = (await (await ctx.get(`${MAIN_API}/membership/settings`, { headers: admin })).json()) as any[];
    const existing = settings.find((s) => s.keyName === "logoLight");
    originalLogo = existing ? { ...existing } : null;
    const saved = await ctx.post(`${MAIN_API}/membership/settings`, { headers: admin, data: [{ ...(existing || { churchId: CHURCH_ID, keyName: "logoLight" }), public: 1, value: LOGO }] });
    expect(saved.ok()).toBeTruthy();

    const forms = await (await ctx.post(`${MAIN_API}/membership/forms`, { headers: admin, data: [{ name: LONG_FORM_NAME, contentType: "form", restricted: false, groupId: GROUP_ID }] })).json();
    const longFormId = forms[0].id;
    try {
      await ctx.post(`${MAIN_API}/membership/questions`, { headers: admin, data: [{ formId: longFormId, fieldType: "Textbox", title: LONG_QUESTION, required: false }] });
      const questions = await (await ctx.get(`${MAIN_API}/membership/questions/unrestricted?formId=${longFormId}`)).json();
      const member = await membershipHeaders(ctx, MEMBER_EMAIL);
      const sub = await ctx.post(`${MAIN_API}/membership/formsubmissions`, {
        headers: member,
        data: [{ formId: longFormId, contentType: "form", contentId: longFormId, answers: [{ questionId: questions[0].id, value: LONG_ANSWER }] }]
      });
      expect(sub.ok()).toBeTruthy();

      // Capture what reaches the printer (the hidden print frame) instead of opening the print dialog.
      await page.addInitScript(() => {
        window.print = function () {
          const style = (sel: string) => getComputedStyle(document.querySelector(sel)!);
          (window.top as any).__printed = {
            html: document.body.innerHTML,
            h1Align: style("h1").textAlign,
            headerAlign: style("header").textAlign,
            dlDisplay: style("dl").display
          };
        };
      });
      await page.goto(`/mobile/groups/${GROUP_ID}`);
      const main = page.locator("main");
      await main.getByTestId("group-form-row").filter({ hasText: LONG_FORM_NAME }).click({ timeout: 20000 });
      await main.getByTestId("group-form-submission").filter({ hasText: MEMBER_NAME }).click();
      const dialog = page.getByRole("dialog");
      const answers = dialog.getByTestId("group-form-answers");
      const value = answers.locator("dd").filter({ hasText: LONG_ANSWER });
      await expect(value).toBeVisible();
      const sheetWidth = (await answers.boundingBox())!.width;
      const valueWidth = (await value.boundingBox())!.width;
      expect(valueWidth, `answer is ${valueWidth}px wide in a ${sheetWidth}px sheet`).toBeGreaterThan(sheetWidth * 0.8);

      await dialog.getByTestId("group-form-print").click();
      await expect.poll(() => page.evaluate(() => (window as any).__printed?.html || ""), { timeout: 10000 }).toContain(LONG_ANSWER);
      const printed = await page.evaluate(() => (window as any).__printed);
      expect(printed.html).toContain(CHURCH_NAME);
      expect(printed.html).toMatch(new RegExp(`<img[^>]*src="${LOGO}"`));
      expect(printed.h1Align).toBe("center");
      expect(printed.headerAlign).toBe("center");
      // The old grid sized the question column to max-content; the iframe is 0x0, so check the layout, not pixels.
      expect(printed.dlDisplay).toBe("block");
    } finally {
      await ctx.delete(`${MAIN_API}/membership/forms/${longFormId}`, { headers: admin });
    }
  });

  test("a printout of many answers starts them on the first page under the letterhead", async ({ page }) => {
    const forms = await (await ctx.post(`${MAIN_API}/membership/forms`, { headers: admin, data: [{ name: PRINT_FORM_NAME, contentType: "form", restricted: false, groupId: GROUP_ID }] })).json();
    const printFormId = forms[0].id;
    try {
      const questionRows = Array.from({ length: 30 }, (_, i) => ({ formId: printFormId, fieldType: "Textbox", title: `Question ${i + 1}: what would you like us to know?`, required: false, sort: i + 1 }));
      await ctx.post(`${MAIN_API}/membership/questions`, { headers: admin, data: questionRows });
      const questions = (await (await ctx.get(`${MAIN_API}/membership/questions/unrestricted?formId=${printFormId}`)).json()) as any[];
      const answers = questions.map((q, i) => ({ questionId: q.id, value: `Answer ${i + 1}` }));
      const sub = await ctx.post(`${MAIN_API}/membership/formsubmissions`, { headers: admin, data: [{ formId: printFormId, contentType: "form", contentId: printFormId, answers }] });
      expect(sub.ok()).toBeTruthy();

      // Capture the print frame's whole document instead of opening the print dialog.
      await page.addInitScript(() => {
        window.print = function () { (window.top as any).__printed = document.documentElement.outerHTML; };
      });
      await page.goto(`/mobile/groups/${GROUP_ID}`);
      const main = page.locator("main");
      await main.getByTestId("group-form-row").filter({ hasText: PRINT_FORM_NAME }).click({ timeout: 20000 });
      await main.getByTestId("group-form-submission").first().click();
      await page.getByRole("dialog").getByTestId("group-form-print").click();
      await expect.poll(() => page.evaluate(() => (window as any).__printed || ""), { timeout: 10000 }).toContain("Answer 30");
      const html: string = await page.evaluate(() => (window as any).__printed);

      // Lay the printout out on Letter paper and count the pages.
      const printPage = await page.context().newPage();
      await printPage.setContent(html.replace(/<img[^>]*>/g, ""));
      const pdf = await printPage.pdf({ format: "Letter", margin: { top: "0", bottom: "0", left: "0", right: "0" } });
      await printPage.close();
      const pdfPages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
      // 30 short answers plus the heading run a little over one Letter page; a gap under the heading makes it three.
      expect(pdfPages, `printout took ${pdfPages} pages`).toBe(2);
    } finally {
      await ctx.delete(`${MAIN_API}/membership/forms/${printFormId}`, { headers: admin });
    }
  });
});
