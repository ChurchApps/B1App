import { test, expect, Page } from "@playwright/test";
import { getApi, apiCall, doingUrl } from "./helpers/api";

// #1382: the Teach view listed the lesson's Downloads above the first lesson section.
const PROVIDER_PATH = "/lessons/PGM00000001/STU00000001/LSN00000001/VEN00000002";

async function seedProviderPlan(name: string): Promise<string> {
  const demo = await getApi("demo");
  try {
    const res = await apiCall(demo, "post", doingUrl("/plans"), [{ ministryId: "GRP0000000a", planTypeId: "PLT00000001", serviceDate: new Date().toISOString().slice(0, 10), notes: "", serviceOrder: true, name, providerId: "lessonschurch", providerPlanId: PROVIDER_PATH, providerPlanName: name, contentType: "provider", contentId: "VEN00000002" }]);
    const body = await res.text();
    expect(res.status(), `plan POST: ${body.slice(0, 300)}`).toBe(200);
    return JSON.parse(body)[0].id;
  } finally {
    await demo.request.dispose();
  }
}

async function mockLessonsChurch(page: Page) {
  const feed = {
    lessonName: "I Can Pray",
    downloads: [{ name: "Rainbow Printables", files: [{ id: "f1", name: "Rainbow Printables.zip", url: "https://content.lessons.church/files/rainbow-printables.zip", fileType: "application/zip", bytes: 2048 }] }]
  };
  await page.route("https://api.lessons.church/**", async (route) => {
    const url = route.request().url();
    let body: unknown = null;
    if (url.includes("/venues/public/planItems/")) body = { venueName: "Kids Classroom", items: [{ id: "sec1", itemType: "section", label: "Warm Up" }] };
    else if (url.includes("/venues/public/actions/")) body = { venueName: "Kids Classroom", sections: [] };
    else if (url.includes("/venues/public/feed/")) body = feed;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test("Teach view shows the lesson sections before the Downloads list", async ({ page }) => {
  const planId = await seedProviderPlan(`Issue 1382 ${Date.now()}`);
  await mockLessonsChurch(page);

  await page.goto(`/mobile/plans/${planId}`);
  await page.getByRole("button", { name: /Teach/i }).click();
  const dialog = page.getByRole("dialog");
  const downloads = dialog.getByTestId("teach-downloads");
  const firstSection = dialog.getByText("Warm Up", { exact: true }).last();
  await expect(downloads).toBeVisible({ timeout: 10000 });
  await expect(firstSection).toBeVisible();

  const sectionFirst = await firstSection.evaluate((el, dl) => !!(el.compareDocumentPosition(dl as Node) & Node.DOCUMENT_POSITION_FOLLOWING), await downloads.elementHandle());
  expect(sectionFirst, "first lesson section should come before the Downloads list").toBe(true);
});
