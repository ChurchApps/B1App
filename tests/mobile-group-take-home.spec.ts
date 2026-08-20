import { test, expect } from "@playwright/test";
import { getApi, apiCall, lessonsUrl, doingUrl } from "./helpers/api";

const ADULT_BIBLE = "GRP00000004";
const MENS_STUDY = "GRP00000016";
const CREATION_ID = "LSN00000001";
const PROVIDER_PATH = "/lessons/PGM00000001/STU00000001/LSN00000001/VEN00000002";

function daysAgoYmd(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function seedTakeHome(unique: string) {
  const admin = await getApi("lessons-admin");
  try {
    const getRes = await apiCall(admin, "get", lessonsUrl(`/lessons/${CREATION_ID}`));
    expect(getRes.ok(), `GET lesson: ${getRes.status()}`).toBeTruthy();
    const lesson = await getRes.json();
    const saveRes = await apiCall(admin, "post", lessonsUrl("/lessons"), [{ ...lesson, bottomLine: unique, verse: "Genesis 9:13 — I have set my rainbow in the clouds.", parentQuestion: "What is one promise God has kept in our family?", parentNote: "Pray together tonight." }]);
    expect(saveRes.ok(), `POST lesson: ${saveRes.status()}`).toBeTruthy();
  } finally {
    await admin.request.dispose();
  }

  const demo = await getApi("demo");
  try {
    const planRes = await apiCall(demo, "post", doingUrl("/plans"), [{ ministryId: "GRP0000000a", planTypeId: "PLT00000001", name: `Take-home ${unique}`, serviceDate: daysAgoYmd(1), notes: "", serviceOrder: true, providerId: "lessonschurch", providerPlanId: PROVIDER_PATH, providerPlanName: unique, contentType: "provider", contentId: "VEN00000002" }]);
    const body = await planRes.text();
    expect(planRes.status(), `plan POST: ${body.slice(0, 300)}`).toBe(200);
    const listed = await apiCall(demo, "get", "http://localhost:8084/membership/groups/GRP00000004/plans");
    const plans = await listed.json();
    expect(Array.isArray(plans) && plans.some((p: any) => p.providerPlanId === PROVIDER_PATH), `group plans: ${JSON.stringify(plans).slice(0, 400)}`).toBeTruthy();
  } finally {
    await demo.request.dispose();
  }
}

test.describe("Group take-home card", () => {
  test("member of a lesson-associated group sees this week's lesson", async ({ page }) => {
    const unique = `TH-${Date.now()}`;
    await seedTakeHome(unique);

    await page.route(/\/lessons\/public\/ids/, async (route) => {
      const ids = new URL(route.request().url()).searchParams.get("ids") || "";
      const res = await page.request.get(`http://localhost:8090/lessons/public/ids?ids=${ids}`);
      await route.fulfill({ status: res.status(), contentType: "application/json", body: await res.text() });
    });

    await page.goto(`/mobile/groups/${ADULT_BIBLE}`);
    const card = page.getByTestId("group-lesson-take-home");
    await expect(card).toBeVisible({ timeout: 20000 });
    await expect(card.getByText("This week's lesson")).toBeVisible();
    await expect(card.getByText(unique)).toBeVisible();
    await expect(card.getByText(/Genesis 9:13/)).toBeVisible();
    await expect(card.getByText(/What is one promise God has kept/)).toBeVisible();
    await expect(card.getByText(/Pray together tonight/)).toBeVisible();
  });

  test("group with no lesson plans shows no take-home card", async ({ page }) => {
    await page.goto(`/mobile/groups/${MENS_STUDY}`);
    await expect(page.locator("main")).toContainText(/Men'?s Bible Study/i, { timeout: 15000 });
    await expect(page.getByTestId("group-lesson-take-home")).toHaveCount(0);
  });
});
