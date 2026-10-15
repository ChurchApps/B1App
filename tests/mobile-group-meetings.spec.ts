import { test, expect, request, type APIRequestContext } from "@playwright/test";

const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000004";
const FUTURE = "2099-01-04";

async function attendanceHeaders(ctx: APIRequestContext) {
  const login = await ctx.post(`${MAIN_API}/membership/users/login`, {
    data: { email: "demo@b1.church", password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  const uc = (await login.json()).userChurches.find((c: any) => c.church?.id === CHURCH_ID);
  const jwt = uc.apis.find((a: any) => a.keyName === "AttendanceApi").jwt;
  return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test.describe("Group meetings", () => {
  test.describe.configure({ mode: "serial" });

  test.afterAll(async () => {
    const ctx = await request.newContext();
    const headers = await attendanceHeaders(ctx);
    const sessions: any[] = await (await ctx.get(`${MAIN_API}/attendance/sessions?groupId=${GROUP_ID}`, { headers })).json();
    for (const s of sessions.filter((x) => String(x.sessionDate).startsWith(FUTURE))) {
      await ctx.delete(`${MAIN_API}/attendance/sessions/${s.id}`, { headers });
    }
  });

  test("leader adds a note for a future meeting and it shows as Upcoming", async ({ page }) => {
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: /^Meetings$/i })).toBeVisible({ timeout: 15000 });
    await expect(main.getByRole("heading", { name: /^Attendance$/i })).toHaveCount(0);

    await page.getByTestId("group-add-note").click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Date").fill(FUTURE);
    await dialog.getByTestId("meeting-note-text").locator(".editor-input[contenteditable='true']").click();
    await page.keyboard.type("**Romans 9** next week.");
    await dialog.getByTestId("meeting-note-save").click();
    await expect(dialog).toBeHidden();

    const row = main.getByTestId("group-meeting-row").filter({ hasText: "Romans 9 next week." });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText("Upcoming");
    await expect(row.locator("strong")).toHaveText("Romans 9");

    await row.getByRole("button").click();
    await expect(dialog.getByTestId("meeting-note-text").locator(".editor-input")).toContainText("Romans 9 next week.", { timeout: 15000 });
    await dialog.getByRole("button", { name: /^Cancel$/i }).click();
  });

  test("notes typed on the Attendance screen show in Meetings", async ({ page }) => {
    const note = `Recap ${Date.now()}`;
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    await page.getByTestId("group-all-attendance").click();
    await expect(page).toHaveURL(/view=attendance/, { timeout: 15000 });
    const notes = page.getByTestId("attendance-notes").locator(".editor-input[contenteditable='true']");
    await notes.click({ timeout: 15000 });
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(note);
    await page.getByRole("button", { name: /^Save Attendance$/i }).click();
    await expect(page.getByText("Attendance saved.")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /^Back to / }).click();
    await expect(page.locator("main").getByTestId("group-meeting-row").filter({ hasText: note })).toBeVisible({ timeout: 15000 });

    await page.reload();
    await page.getByTestId("group-all-attendance").click();
    await expect(page.getByTestId("attendance-notes").locator(".editor-input")).toContainText(note, { timeout: 15000 });

    const ctx = await request.newContext();
    const sessions: any[] = await (await ctx.get(`${MAIN_API}/attendance/sessions?groupId=${GROUP_ID}`, { headers: await attendanceHeaders(ctx) })).json();
    expect(sessions.find((s) => String(s.sessionDate).startsWith(today()))?.notes).toBe(note);
  });
});
