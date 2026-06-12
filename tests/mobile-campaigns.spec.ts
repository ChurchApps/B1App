import { test, expect } from "@playwright/test";

let campaignId: string;
let jwt: string;

async function gotoOverview(page: import("@playwright/test").Page) {
  await page.goto("/mobile/donate");
  const overviewTab = page.getByRole("tab", { name: /Overview/i });
  if (await overviewTab.count() > 0) {
    await overviewTab.waitFor({ state: "visible", timeout: 15000 });
    await overviewTab.click();
  }
}

test.describe.serial("Mobile donate — CampaignProgress", () => {
  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post("http://localhost:8084/membership/users/login", { data: { email: "demo@b1.church", password: "password" } });
    const loginBody = await loginRes.json();
    jwt = loginBody.userChurches[0].jwt;

    const campaignRes = await request.post("http://localhost:8084/giving/campaigns", {
      headers: { Authorization: "Bearer " + jwt },
      data: [{ name: "PW Test Campaign", goalAmount: 10000, startDate: "2026-01-01", endDate: "2026-12-31", showPublic: true, allowSelfPledge: true }]
    });
    const campaigns = await campaignRes.json();
    campaignId = campaigns[0].id;
  });

  test.afterAll(async ({ request }) => {
    const pledgesRes = await request.get("http://localhost:8084/giving/pledges/my", { headers: { Authorization: "Bearer " + jwt } });
    if (pledgesRes.ok()) {
      const pledges = await pledgesRes.json();
      if (Array.isArray(pledges)) {
        for (const p of pledges) {
          if (p.pledge?.campaignId === campaignId || p.campaignId === campaignId) {
            const pledgeId = p.pledge?.id || p.id;
            if (pledgeId) {
              await request.delete("http://localhost:8084/giving/pledges/my/" + pledgeId, { headers: { Authorization: "Bearer " + jwt } });
            }
          }
        }
      }
    }
    await request.delete("http://localhost:8084/giving/campaigns/" + campaignId, { headers: { Authorization: "Bearer " + jwt } });
  });

  test("donate page shows the campaign with progress", async ({ page }) => {
    await gotoOverview(page);
    const progress = page.locator("[data-testid=\"campaign-progress\"]");
    await expect(progress).toBeVisible({ timeout: 15000 });
    await expect(progress).toContainText("PW Test Campaign", { timeout: 15000 });
  });

  test("authenticated member can make a pledge", async ({ page }) => {
    await gotoOverview(page);
    const pledgeBtn = page.locator("[data-testid=\"pledge-button-" + campaignId + "\"]");
    await pledgeBtn.waitFor({ state: "visible", timeout: 15000 });
    await expect(pledgeBtn).toContainText("Make a Pledge");
    await pledgeBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const amountInput = page.locator("[data-testid=\"pledge-amount-input\"] input");
    await amountInput.fill("250");

    await page.locator("[data-testid=\"save-pledge-button\"]").click();

    await expect(page.locator("[data-testid=\"my-pledge-" + campaignId + "\"]")).toBeVisible({ timeout: 15000 });
  });

  test("existing pledge shows Update Pledge", async ({ page }) => {
    await gotoOverview(page);
    const pledgeBtn = page.locator("[data-testid=\"pledge-button-" + campaignId + "\"]");
    await pledgeBtn.waitFor({ state: "visible", timeout: 15000 });
    await expect(pledgeBtn).toContainText("Update Pledge");
  });
});
