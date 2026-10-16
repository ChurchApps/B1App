import { test, expect, Page, request } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";
import { getApi, apiCall, doingUrl } from "./helpers/api";

// One position block on the plan page: has the position name and its service times, not the other position.
const positionCard = (page: Page, position: string, other: string) => page.locator("div")
  .filter({ has: page.getByText(position, { exact: true }) })
  .filter({ has: page.getByText("Service Times", { exact: true }) })
  .filter({ hasNot: page.getByText(other, { exact: true }) })
  .last();

test.describe("Mobile plans", () => {
  // The decline test below flips the seeded Sound Tech assignment; run in order so the Upcoming tests see it Accepted first.
  test.describe.configure({ mode: "serial" });

  test("plans page renders Upcoming and Past sections", async ({ page }) => {
    await page.goto("/mobile/plans");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Plans" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /^Upcoming$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Past$/i })).toBeVisible();
  });

  test("Past assignments slice opens and returns to Plans", async ({ page }) => {
    await page.goto("/mobile/plans");
    const pastLink = page.getByRole("button", { name: /Past assignments/i });
    await pastLink.waitFor({ state: "visible", timeout: 15000 });
    await pastLink.click();
    await expect(page).toHaveURL(/view=past/);
    await expect(page.getByRole("heading", { level: 1, name: /Past assignments/i })).toBeVisible();
    await page.getByRole("button", { name: /Back to Plans/i }).click();
    await expect(page).not.toHaveURL(/view=past/);
  });

  test("Upcoming tab lists demo user's seeded Sound Tech assignment", async ({ page }) => {
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Sound Tech|Upcoming Worship Schedule/i, { timeout: 30000 });
  });

  test("clicking the assignment opens the plan detail (Service Order / Teams sections)", async ({ page }) => {
    await page.goto("/mobile/plans");
    const main = page.locator("main");
    await expect(main).toContainText(/Sound Tech|Upcoming Worship Schedule/i, { timeout: 30000 });
    const card = main.getByText(/Upcoming Worship Schedule|Sound Tech/i).first();
    await card.click();
    await expect(page).toHaveURL(/\/mobile\/plans\/PLA\d+/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Service Order/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Teams/i })).toBeVisible();
    await page.getByRole("button", { name: /All teams/i }).click();
    await expect(page).toHaveURL(/view=teams/);
    await expect(page.getByRole("heading", { level: 1, name: /Teams/i })).toBeVisible();
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

  test("accepted assignment can be declined from the plan page", async ({ page }) => {
    await page.goto("/mobile/plans/PLA00000001");
    const card = positionCard(page, "Sound Tech", "Projection Tech");
    await expect(card.getByText("Accepted", { exact: true })).toBeVisible({ timeout: 30000 });

    await card.getByRole("button", { name: "Decline" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Decline" }).click();
    await expect(card.getByText("Declined", { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test("declined assignment can be accepted again before the service", async ({ page }) => {
    await page.goto("/mobile/plans/PLA00000001");
    const card = positionCard(page, "Sound Tech", "Projection Tech");
    await expect(card.getByText("Declined", { exact: true })).toBeVisible({ timeout: 30000 });

    const accept = page.waitForRequest((r) => r.method() === "POST" && r.url().includes("/assignments/accept/ASS00000008"));
    await card.getByRole("button", { name: "Accept" }).click();
    await accept;
    await expect(card.getByText("Accepted", { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test("Needs reply Decline asks first and Cancel keeps the assignment", async ({ page }) => {
    const declines: string[] = [];
    page.on("request", (r) => { if (r.method() === "POST" && r.url().includes("/assignments/decline/")) declines.push(r.url()); });
    await page.goto("/mobile/plans");
    const needsReply = page.getByRole("region", { name: "Needs your reply" });
    await expect(needsReply).toContainText("Projection Tech", { timeout: 30000 });

    await needsReply.getByRole("button", { name: "Decline" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Decline this assignment?")).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(needsReply).toContainText("Projection Tech");
    expect(declines).toEqual([]);
  });

  test("first Decline on the plan page asks before posting", async ({ page }) => {
    const declines: string[] = [];
    page.on("request", (r) => { if (r.method() === "POST" && r.url().includes("/assignments/decline/")) declines.push(r.url()); });
    await page.goto("/mobile/plans/PLA00000001");
    const card = positionCard(page, "Projection Tech", "Sound Tech");
    await expect(card.getByText("Needs reply", { exact: true })).toBeVisible({ timeout: 30000 });

    await card.getByRole("button", { name: "Decline" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Decline this assignment?")).toBeVisible();
    expect(declines).toEqual([]);

    const decline = page.waitForRequest((r) => r.method() === "POST" && r.url().includes("/assignments/decline/ASS00000009"));
    await dialog.getByRole("button", { name: "Decline" }).click();
    await decline;
    await expect(card.getByText("Declined", { exact: true })).toBeVisible({ timeout: 15000 });
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

const MAIN_API = process.env.API_BASE || "http://localhost:8084";

async function setChurchRegion(region: string) {
  const ctx = await request.newContext();
  try {
    const login = await ctx.post(`${MAIN_API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
    const body = await login.json();
    const uc = (body.userChurches || []).find((c: any) => c.church?.id === "CHU00000001");
    const jwt = uc?.apis?.find((a: any) => a.keyName === "MembershipApi")?.jwt;
    const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
    const settings: any[] = await (await ctx.get(`${MAIN_API}/membership/settings`, { headers })).json();
    const existing = settings.find((s) => s.keyName === "region");
    const res = await ctx.post(`${MAIN_API}/membership/settings`, { headers, data: [{ ...(existing || {}), keyName: "region", value: region, public: 1 }] });
    if (!res.ok()) throw new Error(`save region failed: ${res.status()}`);
  } finally {
    await ctx.dispose();
  }
}

test.describe.serial("Mobile plans — church region dates", () => {
  const MONTH = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)";
  const nextServiceDate = (page: Page) => page.getByTestId("serving-date").first();

  test("next service date follows the church region (UK day-first, US month-first)", async ({ page }) => {
    try {
      await setChurchRegion("en-GB");
      await page.goto("/mobile/plans");
      await expect(nextServiceDate(page)).toHaveText(new RegExp(`^\\d{1,2} ${MONTH} \\d{4}$`), { timeout: 30000 });
    } finally {
      await setChurchRegion("en-US");
    }
    await page.goto("/mobile/plans");
    await expect(nextServiceDate(page)).toHaveText(new RegExp(`^${MONTH} \\d{1,2}, \\d{4}$`), { timeout: 30000 });
  });
});
