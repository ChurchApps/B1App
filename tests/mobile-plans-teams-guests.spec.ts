import { test, expect, type Browser } from "@playwright/test";
import { apiCall, doingUrl, getApi, membershipUrl, type ApiHandle } from "./helpers/api";

// A plan's Serving Teams list showed a member without View People only the rostered people
// whose membership status passes the directory setting, so assigned Guests vanished.
test.describe.configure({ mode: "serial" });
test.use({ storageState: { cookies: [], origins: [] } });

const GUEST = "PER00000071"; // Ryan Lee, switched to Guest for this spec
const MEMBER = "PER00000001"; // John Smith

async function setStatus(demo: ApiHandle, status: string) {
  const person = await (await apiCall(demo, "get", membershipUrl(`/people/${GUEST}`))).json();
  const res = await apiCall(demo, "post", membershipUrl("/people"), [{ ...person, membershipStatus: status }]);
  expect(res.ok()).toBeTruthy();
}

async function signInAsDonald(browser: Browser) {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/mobile/login");
  await page.locator('input[type="email"]').first().fill("counter@b1.church");
  await page.locator('input[type="password"]').first().fill("password");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });
  return { context, page };
}

test.describe("Mobile plan serving teams for members", () => {
  test("a member without View People sees an assigned Guest on the team", async ({ browser }) => {
    const demo = await getApi("demo");
    let planId = "";
    try {
      await setStatus(demo, "Guest");
      const plan = await (await apiCall(demo, "post", doingUrl("/plans"), [{ ministryId: "GRP0000000a", planTypeId: "PLT00000001", name: "Guest Team " + Date.now(), serviceDate: new Date().toISOString().slice(0, 10), notes: "", serviceOrder: true }])).json();
      planId = plan[0].id;
      const pos = await (await apiCall(demo, "post", doingUrl("/positions"), [
        { planId, categoryName: "Greeters", name: "Door Greeter", count: 1, groupId: "GRP0000000b" },
        { planId, categoryName: "Greeters", name: "Parking Greeter", count: 1, groupId: "GRP0000000b" }
      ])).json();
      await apiCall(demo, "post", doingUrl("/assignments"), [
        { positionId: pos[0].id, personId: MEMBER, status: "Accepted" },
        { positionId: pos[1].id, personId: GUEST, status: "Accepted" }
      ]);

      const { context, page } = await signInAsDonald(browser);
      try {
        await page.goto(`/mobile/plans/${planId}?view=teams`);
        const main = page.locator("main");
        await expect(main.getByRole("heading", { name: "Serving Teams" })).toBeVisible({ timeout: 30000 });
        await expect(main.getByText("John Smith")).toBeVisible({ timeout: 15000 });
        await expect(main.getByText("Ryan Lee")).toBeVisible();
      } finally {
        await context.close();
      }
    } finally {
      if (planId) await apiCall(demo, "delete", doingUrl("/plans/" + planId));
      await setStatus(demo, "Member");
      await demo.request.dispose();
    }
  });
});
