import { test, expect, type Page } from "@playwright/test";

/**
 * Issue #837 — verifies notification + private-message delete UI on B1App mobile.
 *
 * The MessagingApi DELETE responses are intercepted with page.route so the demo
 * DB is not mutated. The tests assert:
 *   - delete buttons render for each row
 *   - clicking a delete button removes the row optimistically
 *   - the correct DELETE request is dispatched to MessagingApi
 *   - "Clear All" hits DELETE /notifications/my and empties the list
 */

const fakeNotifications = [
  {
    id: "TEST_NTF_1",
    churchId: "CHU00000001",
    personId: "PER00000082",
    contentType: "task",
    contentId: "TSK00000001",
    timeSent: new Date(Date.now() - 60_000).toISOString(),
    isNew: true,
    message: "Test notification one",
    deliveryMethod: "push"
  },
  {
    id: "TEST_NTF_2",
    churchId: "CHU00000001",
    personId: "PER00000082",
    contentType: "assignment",
    contentId: "ASS00000001",
    timeSent: new Date(Date.now() - 120_000).toISOString(),
    isNew: false,
    message: "Test notification two",
    deliveryMethod: "push"
  }
];

const fakePrivateMessages = [
  {
    id: "TEST_PM_1",
    churchId: "CHU00000001",
    fromPersonId: "PER00000001",
    toPersonId: "PER00000082",
    conversationId: "TEST_CVS_1",
    notifyPersonId: null,
    deliveryMethod: null,
    conversation: {
      id: "TEST_CVS_1",
      churchId: "CHU00000001",
      messages: [
        {
          id: "TEST_MSG_1",
          content: "Hello there",
          personId: "PER00000001",
          timeSent: new Date(Date.now() - 60_000).toISOString()
        }
      ]
    }
  }
];

const fakePeople = [
  {
    id: "PER00000001",
    name: { display: "Donald Clark", first: "Donald", last: "Clark" }
  }
];

async function mockNotificationsApi(page: Page, notifications: typeof fakeNotifications) {
  let current = [...notifications];
  const deleteCalls: string[] = [];

  await page.route(/\/notifications\/my$/, async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(current) });
    } else if (method === "DELETE") {
      deleteCalls.push("ALL");
      current = [];
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    } else {
      await route.continue();
    }
  });

  await page.route(/\/notifications\/[^/]+\/[^/]+$/, async (route) => {
    if (route.request().method() === "DELETE") {
      const url = route.request().url();
      const id = url.split("/").pop()!;
      deleteCalls.push(id);
      current = current.filter((n) => n.id !== id);
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    } else {
      await route.continue();
    }
  });

  await page.route(/\/notifications\/unreadCount$/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ notificationCount: current.length, pmCount: 0 }) });
  });

  return { deleteCalls };
}

async function mockPrivateMessagesApi(page: Page, pms: typeof fakePrivateMessages) {
  let current = [...pms];
  const deleteCalls: string[] = [];

  await page.route(/\/privatemessages(?:\?.*)?$/i, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(current) });
    } else {
      await route.continue();
    }
  });

  await page.route(/\/privatemessages\/[^/?]+$/i, async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    const id = url.split("/").pop()!.split("?")[0];
    if (method === "DELETE") {
      deleteCalls.push(id);
      current = current.filter((p) => p.id !== id);
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' });
    } else {
      await route.continue();
    }
  });

  await page.route(/\/people\/basic\?ids=/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakePeople) });
  });

  return { deleteCalls };
}

test.describe("Issue #837 — mobile delete UI", () => {
  test("notifications page shows delete buttons + Clear All", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await mockNotificationsApi(page, fakeNotifications);

    await page.goto("/mobile/notifications");
    // Wait for at least one notification to render.
    await expect(page.locator('[data-testid^="notification-delete-"]').first()).toBeVisible({ timeout: 30000 });

    // Two notifications => two delete buttons.
    await expect(page.locator('[data-testid^="notification-delete-"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="notifications-clear-all"]')).toBeVisible();
  });

  test("deleting a single notification removes it and calls the API", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    const tracker = await mockNotificationsApi(page, fakeNotifications);

    await page.goto("/mobile/notifications");
    await expect(page.locator('[data-testid^="notification-delete-"]').first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid^="notification-delete-"]')).toHaveCount(2);

    const [requestPromise] = [page.waitForRequest((req) => req.method() === "DELETE" && /\/notifications\/CHU00000001\/TEST_NTF_1$/.test(req.url()), { timeout: 15000 })];
    await page.locator('[data-testid="notification-delete-TEST_NTF_1"]').click();
    const req = await requestPromise;
    expect(req.url()).toMatch(/\/notifications\/CHU00000001\/TEST_NTF_1$/);

    await expect(page.locator('[data-testid="notification-delete-TEST_NTF_1"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="notification-delete-"]')).toHaveCount(1);
    expect(tracker.deleteCalls).toContain("TEST_NTF_1");
  });

  test("Clear All deletes via DELETE /notifications/my and empties the list", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    const tracker = await mockNotificationsApi(page, fakeNotifications);

    await page.goto("/mobile/notifications");
    await expect(page.locator('[data-testid="notifications-clear-all"]')).toBeVisible({ timeout: 30000 });

    const requestPromise = page.waitForRequest((req) => req.method() === "DELETE" && /\/notifications\/my$/.test(req.url()), { timeout: 15000 });
    await page.locator('[data-testid="notifications-clear-all"]').click();
    await requestPromise;

    await expect(page.locator('[data-testid^="notification-delete-"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="notifications-clear-all"]')).toHaveCount(0);
    expect(tracker.deleteCalls).toContain("ALL");
  });

  test("deleting a private-message conversation removes the row and calls DELETE /privateMessages/:id", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    const tracker = await mockPrivateMessagesApi(page, fakePrivateMessages);

    await page.goto("/mobile/messages");
    await expect(page.locator('[data-testid="conversation-delete-TEST_PM_1"]')).toBeVisible({ timeout: 30000 });

    const requestPromise = page.waitForRequest((req) => req.method() === "DELETE" && /\/privatemessages\/TEST_PM_1$/i.test(req.url()), { timeout: 15000 });
    await page.locator('[data-testid="conversation-delete-TEST_PM_1"]').click();
    await requestPromise;

    await expect(page.locator('[data-testid="conversation-delete-TEST_PM_1"]')).toHaveCount(0);
    expect(tracker.deleteCalls).toContain("TEST_PM_1");
  });
});
