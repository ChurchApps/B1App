import { test, expect, request } from "@playwright/test";
import { SEED_PEOPLE, DEMO_CHURCH } from "./helpers/fixtures";
import { mobileLogoutButton } from "./helpers/mobile";

// setDirectoryVisibility mutates a church-wide setting the other blocks read.
test.describe.configure({ mode: "serial" });

async function setDirectoryVisibility(value: string) {
  const ctx = await request.newContext();
  const login = await ctx.post((process.env.API_BASE || "http://localhost:8084") + "/membership/users/login", {
    data: { email: "demo@b1.church", password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const body = await login.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID);
  const jwt = uc?.apis?.find((a: any) => a.keyName === "MembershipApi")?.jwt;
  if (!jwt) throw new Error("MembershipApi JWT not present");
  const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
  const settings = await (await ctx.get((process.env.API_BASE || "http://localhost:8084") + "/membership/settings", { headers })).json();
  const setting = (settings || []).find((x: any) => x.keyName === "directoryVisibility")
    || { churchId: DEMO_CHURCH.ID, public: 1, keyName: "directoryVisibility" };
  setting.value = value;
  const res = await ctx.post((process.env.API_BASE || "http://localhost:8084") + "/membership/settings", { headers, data: [setting] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  await ctx.dispose();
}

test.describe("Mobile community", () => {
  test("community page renders Search Members input", async ({ page }) => {
    await page.goto("/mobile/community");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /Search Members/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("searching for a seeded person returns a result", async ({ page }) => {
    await page.goto("/mobile/community");
    const search = page.getByRole("textbox", { name: /Search Members/i });
    await search.waitFor({ state: "visible", timeout: 15000 });
    await expect(page.locator("main")).toContainText(/Clark|Jackson|Williams|Moore/i, { timeout: 30000 });
    await search.fill("Donald");
    await expect(page.locator("main")).toContainText(/Donald/, { timeout: 15000 });
  });

  test("legacy /mobile/membersSearch slug redirects to /mobile/community", async ({ page }) => {
    await page.goto("/mobile/membersSearch");
    await expect(page).toHaveURL(/\/mobile\/community/);
  });

  test("tapping a member opens their profile", async ({ page }) => {
    await page.goto("/mobile/community");
    const search = page.getByRole("textbox", { name: /Search Members/i });
    await search.waitFor({ state: "visible", timeout: 15000 });
    await expect(page.locator("main")).toContainText(/Clark|Jackson|Williams|Moore/i, { timeout: 30000 });
    await search.fill("Donald");
    const row = page.locator("main").getByText("Donald").first();
    await row.waitFor({ state: "visible", timeout: 15000 });
    await row.click();
    await expect(page).toHaveURL(/\/mobile\/community\/PER\d+/, { timeout: 15000 });
    await expect(page.locator("body")).toContainText(SEED_PEOPLE.DONALD.split(" ")[0]);
  });

  test("member detail page shows household members", async ({ page }) => {
    // Donald Clark (PER00000080) with spouse Carol (PER00000081).
    await page.goto("/mobile/community/PER00000080");
    await expect(mobileLogoutButton(page)).toBeVisible();
    const main = page.locator("main");
    await expect(main).toContainText(/Donald/, { timeout: 30000 });
    await expect(main).toContainText(/Carol/);
  });

  test("adult profile shows the Message quick action", async ({ page }) => {
    await page.goto("/mobile/community/PER00000080");
    const main = page.locator("main");
    await expect(main).toContainText(/Donald/, { timeout: 30000 });
    await expect(main.getByRole("button", { name: /Send message/i })).toBeVisible({ timeout: 15000 });
  });

  test("minor profile hides the Message quick action", async ({ page }) => {
    // Noah Davis (PER00000030, b. 2020) is under the default-18 messaging minimum age.
    await page.goto("/mobile/community/PER00000030");
    const main = page.locator("main");
    await expect(main).toContainText(/Noah/, { timeout: 30000 });
    // Call/text/email actions may also be absent (data-gated); the adult test above guards against a false pass.
    await expect(main.getByRole("button", { name: /Send message/i })).toHaveCount(0);
  });

  test("Show in Directory of Staff hides the directory from a member", async ({ page }) => {
    await setDirectoryVisibility("Staff");
    try {
      await page.goto("/mobile/community");
      await expect(page.getByText("Members Only")).toBeVisible({ timeout: 30000 });
      await expect(page.getByRole("textbox", { name: /Search Members/i })).toHaveCount(0);
    } finally {
      await setDirectoryVisibility("Members");
    }
  });

  test("Show in Directory of Members keeps the directory open to a member", async ({ page }) => {
    await setDirectoryVisibility("Members");
    await page.goto("/mobile/community");
    await expect(page.getByRole("textbox", { name: /Search Members/i })).toBeVisible({ timeout: 30000 });
  });
});
