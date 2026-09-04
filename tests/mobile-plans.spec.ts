import { test, expect, Page } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";
import { getApi, apiCall, doingUrl } from "./helpers/api";

test.describe("Mobile plans", () => {
  test("plans page renders with tabs", async ({ page }) => {
    await page.goto("/mobile/plans");
    await expect(mobileLogoutButton(page)).toBeVisible();
    const tabs = page.locator('[role="tab"]');
    await tabs.first().waitFor({ state: "visible", timeout: 15000 });
    await expect(page.locator('[role="tab"]').filter({ hasText: /Upcoming/i })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: /Past/i })).toBeVisible();
  });

  test("can switch between Upcoming and Past tabs", async ({ page }) => {
    await page.goto("/mobile/plans");
    const pastTab = page.locator('[role="tab"]').filter({ hasText: /Past/i });
    await pastTab.waitFor({ state: "visible", timeout: 15000 });
    await pastTab.click();
    await expect(pastTab).toHaveAttribute("aria-selected", "true");
  });

  test("Upcoming tab lists demo user's seeded Sound Tech assignment", async ({ page }) => {
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Sound Tech|Upcoming Worship Schedule/i, { timeout: 30000 });
  });

  test("clicking the assignment opens the plan detail (Service Order / Teams tabs)", async ({ page }) => {
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Sound Tech|Upcoming Worship Schedule/i, { timeout: 30000 });
    const card = main.getByText(/Upcoming Worship Schedule|Sound Tech/i).first();
    await card.click();
    await expect(page).toHaveURL(/\/mobile\/plans\/PLA\d+/, { timeout: 15000 });
    await expect(page.getByRole("tab", { name: /Service Order/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("tab", { name: /Teams/i })).toBeVisible();
  });

  test("Upcoming tab surfaces both demo user assignments (Sound Tech + Projection Tech)", async ({ page }) => {
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Sound Tech/i, { timeout: 30000 });
    await expect(main).toContainText(/Projection Tech/i);
  });

  test("Unconfirmed assignment surfaces a respond / accept affordance", async ({ page }) => {
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Projection Tech/i, { timeout: 30000 });
    await expect(main).toContainText(/Accept|Respond|Pending Response|Unconfirmed/i);
  });
});

const PROVIDER_PATH = "/lessons/PGM00000001/STU00000001/LSN00000001/VEN00000002";

async function seedPlan(fields: Record<string, unknown>): Promise<string> {
  const demo = await getApi("demo");
  try {
    const res = await apiCall(demo, "post", doingUrl("/plans"), [{ ministryId: "GRP0000000a", planTypeId: "PLT00000001", serviceDate: new Date().toISOString().slice(0, 10), notes: "", serviceOrder: true, ...fields }]);
    const body = await res.text();
    expect(res.status(), `plan POST: ${body.slice(0, 300)}`).toBe(200);
    const planId = JSON.parse(body)?.[0]?.id;
    expect(planId, `plan id missing: ${body.slice(0, 300)}`).toBeTruthy();
    return planId;
  } finally {
    await demo.request.dispose();
  }
}

async function seedPlanItem(planId: string, label: string) {
  const demo = await getApi("demo");
  try {
    const res = await apiCall(demo, "post", doingUrl("/planItems"), [{ planId, itemType: "item", label, sort: 1, seconds: 60 }]);
    expect(res.ok(), `planItem POST: ${res.status()}`).toBeTruthy();
  } finally {
    await demo.request.dispose();
  }
}

const printableFeed = {
  lessonName: "I Can Pray",
  lessonImage: "https://content.lessons.church/lesson.jpg",
  downloads: [
    { name: "Rainbow Printables", files: [{ id: "f1", name: "Rainbow Printables.zip", url: "https://content.lessons.church/files/rainbow-printables.zip", fileType: "application/zip", bytes: 2048 }] },
    { name: "Lesson Video", files: [{ id: "f2", name: "lesson.mp4", url: "https://content.lessons.church/files/lesson.mp4", fileType: "video/mp4" }] }
  ]
};

// The lessonschurch provider fetches api.lessons.church from the browser; intercept so specs never depend on the live service.
async function mockLessonsChurch(page: Page, feed: Record<string, unknown>) {
  await page.route("https://api.lessons.church/**", async (route) => {
    const url = route.request().url();
    let body: unknown = null;
    if (url.includes("/venues/public/planItems/")) body = { venueName: "Kids Classroom", items: [{ id: "sec1", itemType: "section", label: "Warm Up" }] };
    else if (url.includes("/venues/public/actions/")) body = { venueName: "Kids Classroom", sections: [] };
    else if (url.includes("/venues/public/feed/")) body = feed;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test.describe("Plan downloads (lesson printables)", () => {
  test("provider-associated plan lists printables and keeps playlist media out", async ({ page }) => {
    const unique = `Printables ${Date.now()}`;
    const planId = await seedPlan({ name: unique, providerId: "lessonschurch", providerPlanId: PROVIDER_PATH, providerPlanName: unique, contentType: "provider", contentId: "VEN00000002" });
    await mockLessonsChurch(page, printableFeed);

    await page.goto(`/mobile/plans/${planId}`);
    const downloadsBlock = page.getByTestId("plan-downloads");
    await expect(downloadsBlock).toBeVisible({ timeout: 20000 });
    const zipLink = downloadsBlock.locator("a", { hasText: "Rainbow Printables" });
    await expect(zipLink).toBeVisible();
    await expect(zipLink).toHaveAttribute("href", "https://content.lessons.church/files/rainbow-printables.zip");
    await expect(downloadsBlock.getByText("Lesson Video")).toHaveCount(0);

    // teach view carries the same list
    await page.getByRole("button", { name: /Teach/i }).click();
    await expect(page.getByTestId("teach-downloads")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("teach-downloads").getByText("Rainbow Printables")).toBeVisible();
  });

  test("customized service order still shows the lesson's printables", async ({ page }) => {
    const unique = `Customized ${Date.now()}`;
    const planId = await seedPlan({ name: unique, providerId: "lessonschurch", providerPlanId: PROVIDER_PATH, providerPlanName: unique, contentType: "provider", contentId: "VEN00000002" });
    await seedPlanItem(planId, "Custom Welcome Segment");
    await mockLessonsChurch(page, printableFeed);

    await page.goto(`/mobile/plans/${planId}`);
    await expect(page.locator("main")).toContainText("Custom Welcome Segment", { timeout: 20000 });
    const downloadsBlock = page.getByTestId("plan-downloads");
    await expect(downloadsBlock).toBeVisible({ timeout: 20000 });
    await expect(downloadsBlock.getByText("Rainbow Printables")).toBeVisible();
  });

  test("plan without a provider shows no downloads block", async ({ page }) => {
    const unique = `No Provider ${Date.now()}`;
    const planId = await seedPlan({ name: unique });
    await seedPlanItem(planId, "Welcome and Announcements");

    await page.goto(`/mobile/plans/${planId}`);
    await expect(page.locator("main")).toContainText("Welcome and Announcements", { timeout: 20000 });
    await expect(page.getByTestId("plan-downloads")).toHaveCount(0);
  });

  test("provider feed without downloads shows no downloads block", async ({ page }) => {
    const unique = `Empty Feed ${Date.now()}`;
    const planId = await seedPlan({ name: unique, providerId: "lessonschurch", providerPlanId: PROVIDER_PATH, providerPlanName: unique, contentType: "provider", contentId: "VEN00000002" });
    await mockLessonsChurch(page, { lessonName: "I Can Pray" });

    await page.goto(`/mobile/plans/${planId}`);
    await expect(page.locator("main")).toContainText(/Warm Up/i, { timeout: 20000 });
    await expect(page.getByTestId("plan-downloads")).toHaveCount(0);
  });
});
