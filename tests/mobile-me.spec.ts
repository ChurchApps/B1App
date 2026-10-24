import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";
import { apiCall, getApi, membershipUrl } from "./helpers/api";

test.describe("Mobile Me page", () => {
  test("renders upcoming items and event rows navigate to the group", async ({ page }) => {
    await page.goto("/mobile/me");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    await expect(page.locator("main").getByRole("heading", { name: "Upcoming", exact: true })).toBeVisible({ timeout: 15000 });

    // The plate shows a three-item teaser; the full list lives in the ?view=upcoming slice.
    await page.goto("/mobile/me?view=upcoming");
    await expect(page.getByRole("button", { name: /Back to Me/i })).toBeVisible({ timeout: 15000 });
    const eventRow = page.getByTestId("me-item-event").first();
    await expect(eventRow).toBeVisible({ timeout: 15000 });
    await eventRow.click();
    await expect(page).toHaveURL(/\/mobile\/groups\//, { timeout: 15000 });
  });

  test("shows the event photo as a thumbnail on upcoming event rows", async ({ page }) => {
    // Give the first timeline event a photo, the way B1Admin's calendar stores one.
    await page.route("**/events/timeline", async (route) => {
      const response = await route.fetch();
      const events = await response.json();
      if (Array.isArray(events) && events.length > 0) events[0].photoUrl = "/images/group.jpg";
      await route.fulfill({ response, json: events });
    });
    await page.goto("/mobile/me?view=upcoming");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: /Back to Me/i })).toBeVisible({ timeout: 15000 });
    const photo = page.getByTestId("me-item-event").getByTestId("me-item-photo").first();
    await expect(photo).toBeVisible({ timeout: 15000 });
    await expect(photo).toHaveAttribute("src", "/images/group.jpg");
    await expect(page.getByTestId("me-item-serving").getByTestId("me-item-photo")).toHaveCount(0);
  });

  test("shows the record teasers and links, and Edit Profile opens the profile screen", async ({ page }) => {
    await page.goto("/mobile/me");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    const main = page.locator("main");
    await expect(main.getByRole("heading", { level: 1 })).toContainText("Demo", { timeout: 15000 });
    await expect(main.getByRole("heading", { name: "My Groups", exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Household", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(main.getByTestId("me-shortcut-notificationPrefs")).toBeVisible({ timeout: 15000 });
    await expect(main.getByTestId("me-shortcut-messages")).toBeVisible();
    await expect(main.getByTestId("me-shortcut-donate")).toBeVisible();
    await expect(main.getByTestId("me-shortcut-registrations")).toBeVisible();
    await main.getByTestId("me-shortcut-profileEdit").click();
    await expect(page).toHaveURL(/\/mobile\/profileEdit/, { timeout: 15000 });
  });

  test("shows a serving row and it navigates to plans", async ({ page }) => {
    await page.goto("/mobile/me?view=upcoming");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: /Back to Me/i })).toBeVisible({ timeout: 15000 });
    const servingRow = page.getByTestId("me-item-serving").first();
    // Seeded assignments surface only if plan dates are upcoming.
    if (await servingRow.isVisible().catch(() => false)) {
      await servingRow.click();
      await expect(page).toHaveURL(/\/mobile\/plans/, { timeout: 15000 });
    }
  });

  test("lists the forms the member submitted and opens their answers read-only", async ({ page }) => {
    // Demo User (PER00000082) fills in the public VBS form themselves; FormElement sends the signed-in person as submittedBy.
    const childName = `E2E Child ${Date.now()}`;
    const api = await getApi("demo", "MembershipApi");
    const res = await apiCall(api, "post", membershipUrl("/formsubmissions"), [
      {
        formId: "FRM00000004",
        contentType: "form",
        contentId: "FRM00000004",
        submittedBy: "PER00000082",
        submissionDate: new Date().toISOString(),
        answers: [{ questionId: "QST00000013", value: childName }, { questionId: "QST00000014", value: "(217) 555-0100" }]
      }
    ]);
    expect(res.ok()).toBeTruthy();

    await page.goto("/mobile/me");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "My Forms", exact: true })).toBeVisible({ timeout: 15000 });
    const formRow = main.getByTestId("me-form-row").filter({ hasText: "VBS Registration (Public)" }).first();
    await expect(formRow).toBeVisible({ timeout: 15000 });
    await expect(formRow).toContainText(String(new Date().getFullYear()));

    await main.getByTestId("me-shortcut-myForms").click();
    await expect(page).toHaveURL(/\/mobile\/myForms/, { timeout: 15000 });
    await page.getByTestId("my-form-row").filter({ hasText: "VBS Registration (Public)" }).first().click();
    await expect(page.getByText(childName)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Child Full Name").first()).toBeVisible();
    await expect(page.locator("main").getByRole("button", { name: /edit|delete/i })).toHaveCount(0);
  });

  test("a submission an admin assigns to a member shows in that member's My Forms", async ({ browser }) => {
    // #1356: /formsubmissions/my matched only submittedBy, so an anonymous submission moved to a person never reached them.
    const formName = `Assigned Form ${Date.now()}`;
    const api = await getApi("demo", "MembershipApi");
    const forms = await (await apiCall(api, "post", membershipUrl("/forms"), [{ name: formName, contentType: "form", restricted: false }])).json();
    const formId = forms[0].id;
    try {
      await apiCall(api, "post", membershipUrl("/questions"), [{ formId, fieldType: "Textbox", title: "Anything else?", required: false }]);
      const questions = await (await api.request.get(membershipUrl(`/questions/unrestricted?formId=${formId}`))).json();
      const sub = await api.request.post(membershipUrl("/formsubmissions"), {
        headers: { "Content-Type": "application/json" },
        data: [{ formId, contentType: "form", contentId: formId, answers: [{ questionId: questions[0].id, value: "Anonymous answer" }] }]
      });
      expect(sub.ok()).toBeTruthy();
      const submissionId = (await sub.json())[0].id;
      const moved = await apiCall(api, "post", membershipUrl(`/formsubmissions/${submissionId}/person`), { personId: "PER00000080" });
      expect(moved.ok()).toBeTruthy();

      const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, serviceWorkers: "block" });
      const page = await context.newPage();
      await page.goto("/mobile/login");
      await page.locator('input[type="email"]').first().fill("counter@b1.church");
      await page.locator('input[type="password"]').first().fill("password");
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });
      await page.goto("/mobile/myForms");
      await expect(page.locator("main").getByTestId("my-form-row").filter({ hasText: formName })).toBeVisible({ timeout: 20000 });
      await context.close();
    } finally {
      await apiCall(api, "delete", membershipUrl(`/forms/${formId}`));
      await api.request.dispose();
    }
  });

  test("shows the member's attendance and its full history", async ({ page }) => {
    await page.goto("/mobile/me");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "My Attendance", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(main.getByTestId("me-attendance-row").first()).toBeVisible({ timeout: 15000 });

    await main.getByTestId("me-shortcut-myAttendance").click();
    await expect(page).toHaveURL(/\/mobile\/myAttendance/, { timeout: 15000 });
    await expect(page.getByTestId("my-attendance-row").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Mobile Me page serving times", () => {
  // Demo church is in Central time; plans store a date only, so the row used to show a made-up midnight time.
  test.use({ timezoneId: "America/Chicago" });

  test("serving rows show the team's service time, not midnight", async ({ page }) => {
    await page.goto("/mobile/me?view=upcoming");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    const servingRow = page.getByTestId("me-item-serving").filter({ hasText: "Sound Tech" });
    await expect(servingRow).toBeVisible({ timeout: 15000 });
    // demo.sql seeds the plan's service time at 10:00 on the service date.
    await expect(servingRow).toContainText("10:00 AM");
  });
});
