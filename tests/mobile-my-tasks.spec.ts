import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { mobileSignedInChrome } from "./helpers/mobile";

const API = process.env.API_BASE || "http://localhost:8084";
const DEMO_PERSON = "PER00000082";

// Cards and open tasks assigned to the signed-in member show on Me and Home, and a card can be worked from the app.
test.describe.serial("Mobile my cards and tasks", () => {
  let ctx: APIRequestContext;
  let headers: Record<string, string>;
  let cardId = "";
  let taskId = "";

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = login.userChurches.find((c: any) => c.church?.id === "CHU00000001");
    const doing = uc.apis.find((a: any) => a.keyName === "DoingApi");
    headers = { Authorization: `Bearer ${doing.jwt}` };

    // A card about Donald Clark on the Membership Class "Attended" step (no outcomes), assigned to the demo user.
    const card = await (await ctx.post(`${API}/doing/tasks/addToWorkflow`, {
      headers,
      data: { workflowId: "WFL00000002", stepId: "WFS00000005", associatedWith: { type: "person", id: "PER00000080", label: "Donald Clark" } }
    })).json();
    cardId = card.id;
    await ctx.post(`${API}/doing/tasks/${cardId}/reassign`, { headers, data: { assignedToType: "person", assignedToId: DEMO_PERSON, assignedToLabel: "Demo User" } });

    const tasks = await (await ctx.post(`${API}/doing/tasks`, {
      headers,
      data: [{ title: "Call Donald Clark about ushers", status: "Open", assignedToType: "person", assignedToId: DEMO_PERSON, assignedToLabel: "Demo User", createdByType: "person", createdById: "PER00000027", createdByLabel: "Michael Davis", associatedWithType: "person", associatedWithId: "PER00000080", associatedWithLabel: "Donald Clark" }]
    })).json();
    taskId = tasks[0].id;
  });

  test.afterAll(async () => {
    if (cardId) await ctx.post(`${API}/doing/tasks/${cardId}/remove`, { headers, data: {} });
    if (taskId) {
      const task = await (await ctx.get(`${API}/doing/tasks/${taskId}`, { headers })).json();
      await ctx.post(`${API}/doing/tasks`, { headers, data: [{ ...task, status: "Closed", dateClosed: new Date().toISOString() }] });
    }
    await ctx.dispose();
  });

  test("Me lists my cards and my open tasks", async ({ page }) => {
    await page.goto("/mobile/me");
    await expect(mobileSignedInChrome(page)).toBeVisible({ timeout: 30000 });
    const main = page.locator("main");
    const cards = main.getByTestId("me-cards-section");
    await expect(cards.getByRole("heading", { name: "My cards", exact: true })).toBeVisible({ timeout: 20000 });
    await expect(cards.getByTestId("task-row-card").filter({ hasText: "Donald Clark" })).toBeVisible();
    await expect(cards.getByTestId("task-row-card").filter({ hasText: "James Wilson" })).toBeVisible();

    const tasks = main.getByTestId("me-tasks-section");
    await expect(tasks.getByRole("heading", { name: "My tasks", exact: true })).toBeVisible();
    await expect(tasks.getByTestId("task-row-task").filter({ hasText: "Call Donald Clark about ushers" })).toBeVisible();

    // A plain task opens read-only: who it is about and its notes, no Complete.
    await tasks.getByTestId("task-row-task").filter({ hasText: "Call Donald Clark about ushers" }).click();
    const taskSheet = page.getByRole("dialog");
    await expect(taskSheet.getByText("Michael Davis", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(taskSheet.getByText("Donald Clark", { exact: true })).toBeVisible();
    await expect(taskSheet.getByRole("button", { name: "Complete" })).toHaveCount(0);
    // ChurchAppsSupport#1574: the assignee can call or email the person the task is about.
    await expect(taskSheet.getByTestId("task-contact-phone")).toHaveAttribute("href", /^tel:\(217\) 555-25/, { timeout: 15000 });
    await expect(taskSheet.getByTestId("task-contact-email")).toHaveAttribute("href", "mailto:donald.clark@email.com");
  });

  test("a card opens a sheet that snoozes and completes it", async ({ page }) => {
    await page.goto("/mobile/me");
    await expect(mobileSignedInChrome(page)).toBeVisible({ timeout: 30000 });
    const cards = page.locator("main").getByTestId("me-cards-section");
    await cards.getByTestId("task-row-card").filter({ hasText: "Donald Clark" }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "Donald Clark" })).toBeVisible({ timeout: 15000 });
    await expect(sheet.getByText("Attended")).toBeVisible({ timeout: 15000 });
    await expect(sheet.getByRole("link", { name: "Donald Clark" })).toHaveAttribute("href", "/mobile/community/PER00000080");
    await expect(sheet.getByTestId("task-contact-phone")).toHaveAttribute("href", /^tel:\(217\) 555-25/, { timeout: 15000 });
    await expect(sheet.getByTestId("task-contact-email")).toHaveAttribute("href", "mailto:donald.clark@email.com");
    await expect(sheet.getByText("Notes", { exact: true })).toBeVisible();

    await sheet.getByRole("button", { name: "3 days" }).click();
    await expect(sheet.getByTestId("card-snoozed-until")).toBeVisible({ timeout: 15000 });
    await expect(cards.getByTestId("task-row-card").filter({ hasText: "Donald Clark" }).getByText("Snoozed")).toBeVisible({ timeout: 15000 });

    await sheet.getByRole("button", { name: "Complete" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 15000 });
    await expect(cards.getByTestId("task-row-card").filter({ hasText: "Donald Clark" })).toHaveCount(0, { timeout: 15000 });
    cardId = "";
  });

  test("Home teases follow-ups and links to the full list", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible({ timeout: 30000 });
    const teaser = page.locator("main").getByTestId("home-tasks-section");
    await expect(teaser.getByRole("heading", { name: "Your follow-ups" })).toBeVisible({ timeout: 20000 });
    await expect(teaser.getByTestId("task-row-card").first()).toBeVisible();
    await teaser.getByRole("link", { name: "All" }).click();

    await expect(page).toHaveURL(/\/mobile\/myTasks/, { timeout: 15000 });
    // Home stays mounted behind the new screen, so read the rows from the list's own sections.
    const cardsList = page.getByRole("region", { name: "Cards", exact: true });
    await expect(cardsList).toBeVisible({ timeout: 15000 });
    await expect(cardsList.getByTestId("task-row-card").filter({ hasText: "James Wilson" })).toBeVisible();
    const tasksList = page.getByRole("region", { name: "Tasks", exact: true });
    await expect(tasksList.getByTestId("task-row-task").filter({ hasText: "Call Donald Clark about ushers" })).toBeVisible();
  });

  // ChurchAppsSupport#1494: the Api returns tasks oldest first and cards soonest due first; the app shows the newest on top.
  test("follow-ups list the newest task and card first", async ({ page }) => {
    const base = { status: "Open", assignedToType: "person", assignedToId: DEMO_PERSON, assignedToLabel: "Demo User", associatedWithType: "person", associatedWithId: "PER00000080", associatedWithLabel: "Donald Clark" };
    const cards = [
      { ...base, id: "CRDOLD", workflowId: "WFL00000002", stepId: "WFS00000005", taskNumber: 901, title: "Older card for Donald Clark", dateCreated: "2026-01-05T10:00:00Z", dueDate: "2026-01-10T00:00:00Z" },
      { ...base, id: "CRDNEW", workflowId: "WFL00000002", stepId: "WFS00000005", taskNumber: 902, title: "Newer card for Donald Clark", dateCreated: "2026-03-05T10:00:00Z", dueDate: "2026-12-10T00:00:00Z" }
    ];
    const tasks = [
      { ...base, id: "TSKOLD", taskNumber: 903, title: "Older task about Donald Clark", dateCreated: "2026-01-06T10:00:00Z" },
      { ...base, id: "TSKNEW", taskNumber: 904, title: "Newer task about Donald Clark", dateCreated: "2026-03-06T10:00:00Z" }
    ];
    await page.route("**/doing/tasks/cards/my", (route) => route.fulfill({ json: cards }));
    await page.route(/\/doing\/tasks$/, (route) => route.fulfill({ json: tasks }));
    await page.goto("/mobile/myTasks");
    await expect(mobileSignedInChrome(page)).toBeVisible({ timeout: 30000 });
    const cardsList = page.getByRole("region", { name: "Cards", exact: true });
    await expect(cardsList.getByTestId("task-row-card")).toHaveCount(2, { timeout: 20000 });
    await expect(cardsList.getByTestId("task-row-card").first()).toContainText("Newer card for Donald Clark");
    const tasksList = page.getByRole("region", { name: "Tasks", exact: true });
    await expect(tasksList.getByTestId("task-row-task")).toHaveCount(2);
    await expect(tasksList.getByTestId("task-row-task").first()).toContainText("Newer task about Donald Clark");
  });

  // ChurchAppsSupport#1577: a task and a card show when they were created, date and time.
  test("task and card sheets show the full creation date and time", async ({ page }) => {
    const base = { status: "Open", assignedToType: "person", assignedToId: DEMO_PERSON, assignedToLabel: "Demo User", associatedWithType: "person", associatedWithId: "PER00000080", associatedWithLabel: "Donald Clark", createdByLabel: "Michael Davis" };
    await page.route("**/doing/tasks/cards/my", (route) => route.fulfill({ json: [{ ...base, id: "CRDTIME", workflowId: "WFL00000002", stepId: "WFS00000005", taskNumber: 905, title: "Timed card for Donald Clark", dateCreated: "2026-11-14T19:37:00Z" }] }));
    await page.route(/\/doing\/tasks$/, (route) => route.fulfill({ json: [{ ...base, id: "TSKTIME", taskNumber: 906, title: "Timed task about Donald Clark", dateCreated: "2026-11-14T19:37:00Z" }] }));
    const dateTime = /Nov 1[45], 2026,? \d{1,2}:37\s?[AP]M/;

    await page.goto("/mobile/me");
    await expect(mobileSignedInChrome(page)).toBeVisible({ timeout: 30000 });
    await page.locator("main").getByTestId("task-row-task").filter({ hasText: "Timed task about Donald Clark" }).click({ timeout: 20000 });
    await expect(page.getByRole("dialog").getByText(dateTime)).toBeVisible({ timeout: 15000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 15000 });

    await page.locator("main").getByTestId("task-row-card").filter({ hasText: "Donald Clark" }).first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Created", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(sheet.getByText(dateTime)).toBeVisible();
  });

  test("sections stay hidden when nothing is assigned", async ({ page }) => {
    await page.route("**/doing/tasks/cards/my", (route) => route.fulfill({ json: [] }));
    await page.route(/\/doing\/tasks$/, (route) => route.fulfill({ json: [] }));
    await page.goto("/mobile/me");
    await expect(mobileSignedInChrome(page)).toBeVisible({ timeout: 30000 });
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "My Groups", exact: true })).toBeVisible({ timeout: 20000 });
    await expect(main.getByTestId("me-cards-section")).toHaveCount(0);
    await expect(main.getByTestId("me-tasks-section")).toHaveCount(0);

    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible({ timeout: 30000 });
    await expect(page.locator("main").getByTestId("home-tasks-section")).toHaveCount(0);
  });
});
