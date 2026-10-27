import { test, expect, Page } from "@playwright/test";
import { getApi, apiCall, doingUrl } from "./helpers/api";

// Issue #1388: in the Teach view the prev/next section buttons sat inside the scrolling
// lesson content, so one tap on "next" scrolled them off screen.
test.use({ viewport: { width: 390, height: 844 } });

const PROVIDER_PATH = "/lessons/PGM00000001/STU00000001/LSN00000001/VEN00000002";
const SECTIONS = ["Warm Up", "Bible Story", "Small Group", "Craft Time", "Prayer", "Goodbye"];
const LONG_SAY = Array.from({ length: 12 }, (_, i) => `Line ${i + 1} the teacher reads aloud to the class.`).join("\n\n");

async function seedPlan(name: string): Promise<string> {
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
  const items = SECTIONS.map((label, i) => ({
    id: `sec${i + 1}`,
    itemType: "section",
    label,
    children: [{ id: `act${i + 1}`, itemType: "action", actionType: "say", label: `${label} script`, content: LONG_SAY }]
  }));
  await page.route("https://api.lessons.church/**", async (route) => {
    const url = route.request().url();
    let body: unknown = null;
    if (url.includes("/venues/public/planItems/")) body = { venueName: "Kids Classroom", items };
    else if (url.includes("/venues/public/actions/")) body = { venueName: "Kids Classroom", sections: [] };
    else if (url.includes("/venues/public/feed/")) body = { lessonName: "I Can Pray" };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test("Teach view keeps the next section button on screen after tapping it", async ({ page }) => {
  const planId = await seedPlan(`Teach nav ${Date.now()}`);
  await mockLessonsChurch(page);

  await page.goto(`/mobile/plans/${planId}`);
  await page.getByRole("button", { name: /Teach/i }).click();
  const dialog = page.getByRole("dialog");

  await dialog.getByRole("button", { name: "Bible Story" }).click();
  await expect(dialog.getByText(/2 of 6/)).toBeAttached();

  const next = dialog.getByRole("button", { name: "Small Group" });
  await expect(next).toBeInViewport();
  await next.click();
  await expect(dialog.getByRole("button", { name: "Craft Time" })).toBeInViewport();
});
