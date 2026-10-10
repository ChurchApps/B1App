import { test, expect, request } from "@playwright/test";

const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000023";

// Clicking edit on one date of a repeating group event must ask which dates to change
// before the series editor opens, and "Just this date" must not rewrite the series.
test("editing one date of a repeating group event asks before opening the series", async ({ page }) => {
  const title = `One Date ${Date.now()}`;
  const onceTitle = `${title} Once`;
  const ctx = await request.newContext();
  const login = await (await ctx.post(`${MAIN_API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
  const uc = (login.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || login.userChurches?.[0];
  const auth = { headers: { Authorization: "Bearer " + (uc?.jwt as string) } };
  const seriesStart = new Date();
  seriesStart.setDate(seriesStart.getDate() - 28);
  seriesStart.setHours(18, 0, 0, 0);
  const end = new Date(seriesStart);
  end.setHours(19, 0, 0, 0);
  const created = await (await ctx.post(`${MAIN_API}/content/events`, {
    ...auth,
    data: [{ groupId: GROUP_ID, title, start: seriesStart, end, allDay: false, visibility: "public", recurrenceRule: "FREQ=WEEKLY;INTERVAL=1" }]
  })).json();
  const eventId = (Array.isArray(created) ? created[0] : created)?.id as string;
  expect(eventId, "created event id").toBeTruthy();

  try {
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    await page.getByRole("tab", { name: /Events/i }).click();
    const editEvent = page.getByRole("button", { name: /^Edit event$/i });
    const card = page.locator("main div").filter({ hasText: title }).filter({ has: editEvent }).last();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.getByRole("button", { name: /^Edit event$/i }).click();

    await expect(page.getByText("Just this date")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Edit event", { exact: true })).toHaveCount(0);

    await page.getByRole("radio", { name: "Just this date" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Edit event", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText("Recurring", { exact: true })).toHaveCount(0);

    const titleInput = dialog.getByRole("textbox", { name: "Title" });
    await expect(dialog.locator("#markdown-editor-wrapper")).toBeVisible();
    await titleInput.click();
    await titleInput.fill(onceTitle);
    await dialog.getByRole("button", { name: /^Save Changes$/ }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 10000 });

    const list = await (await ctx.get(`${MAIN_API}/content/events/group/${GROUP_ID}`, auth)).json();
    const rows = Array.isArray(list) ? list : [];
    const original = rows.find((e: any) => e.id === eventId);
    const oneOff = rows.find((e: any) => e.title === onceTitle);
    expect(original?.title).toBe(title);
    expect(original?.recurrenceRule || "").toContain("FREQ=WEEKLY");
    expect(oneOff, "standalone copy of this date").toBeTruthy();
    expect(oneOff.recurrenceRule || "").toBe("");
    expect(oneOff.id).not.toBe(eventId);
    if (oneOff?.id) await ctx.delete(`${MAIN_API}/content/events/${oneOff.id}`, auth);
  } finally {
    await ctx.delete(`${MAIN_API}/content/events/${eventId}`, auth);
    await ctx.dispose();
  }
});
