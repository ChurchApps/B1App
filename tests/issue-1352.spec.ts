import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// Issue #1352: on a phone, a leader opening a submitted group form saw the answer squeezed into a
// one-letter-wide strip, because a long question took the whole label column. The printout used the
// same side-by-side layout and carried no church letterhead.
const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const GROUP_ID = "GRP00000023"; // Community Service Team, led by Demo User
const FORM_NAME = "Issue 1352 Phone Agreement";
const QUESTION = "I understand the ministry phone is not my personal property and must be returned when I leave the role.";
const ANSWER = "Derrick Gyamfi — Elder Leader Pastor";
const MEMBER_EMAIL = "counter@b1.church";
const MEMBER_PERSON_ID = "PER00000080";
const MEMBER_NAME = "Donald Clark";

test.use({ viewport: { width: 390, height: 844 } });

async function membershipHeaders(ctx: APIRequestContext, email: string) {
  const login = await ctx.post(`${MAIN_API}/membership/users/login`, {
    data: { email, password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  expect(login.ok()).toBeTruthy();
  const uc = (await login.json()).userChurches.find((c: any) => c.church?.id === DEMO_CHURCH.ID);
  const jwt = uc.apis.find((a: any) => a.keyName === "MembershipApi")?.jwt || uc.jwt;
  return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}

test.describe("Issue #1352 — submitted form answers on a phone", () => {
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
      data: [{ formId, contentType: "form", contentId: formId, answers: [{ questionId: questions[0].id, value: ANSWER }] }]
    });
    expect(sub.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    if (formId) await ctx.delete(`${MAIN_API}/membership/forms/${formId}`, { headers: admin });
    if (groupMemberId) await ctx.delete(`${MAIN_API}/membership/groupmembers/${groupMemberId}`, { headers: admin });
    await ctx.dispose();
  });

  test("the answer gets the sheet's width and the printout has a centered church letterhead", async ({ page }) => {
    // Capture what reaches the printer instead of opening the print dialog.
    await page.addInitScript(() => {
      window.print = function () {
        (window.top as any).__printed = { html: document.body.innerHTML, h1Align: getComputedStyle(document.querySelector("h1")!).textAlign };
      };
    });
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    const main = page.locator("main");
    await main.getByTestId("group-form-row").filter({ hasText: FORM_NAME }).click({ timeout: 20000 });
    await main.getByTestId("group-form-submission").filter({ hasText: MEMBER_NAME }).click();
    const answers = page.getByRole("dialog").getByTestId("group-form-answers");
    const value = answers.locator("dd").filter({ hasText: ANSWER });
    await expect(value).toBeVisible();

    const sheetWidth = (await answers.boundingBox())!.width;
    const valueWidth = (await value.boundingBox())!.width;
    expect(valueWidth, `answer is ${valueWidth}px wide in a ${sheetWidth}px sheet`).toBeGreaterThan(sheetWidth * 0.8);

    await page.getByRole("dialog").getByTestId("group-form-print").click();
    await expect.poll(() => page.evaluate(() => (window as any).__printed?.html || "")).toContain(ANSWER);
    const printed = await page.evaluate(() => (window as any).__printed);
    expect(printed.html).toContain(DEMO_CHURCH.NAME);
    expect(printed.h1Align).toBe("center");
  });
});
