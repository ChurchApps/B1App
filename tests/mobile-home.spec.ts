import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { mobileSignedInChrome } from "./helpers/mobile";

const API = process.env.API_BASE || "http://localhost:8084";

// The demo church's nav has no Groups/Plans links, and Home only teases features the church turned on.
test.describe.serial("Mobile home teasers", () => {
  let ctx: APIRequestContext;
  let headers: Record<string, string>;
  let linkIds: string[] = [];

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = login.userChurches.find((c: any) => c.church?.id === "CHU00000001");
    headers = { Authorization: `Bearer ${uc.jwt}` };
    const saved = await (await ctx.post(`${API}/content/links`, {
      headers,
      data: [
        { churchId: "CHU00000001", category: "b1Tab", linkType: "groups", text: "Groups", sort: 20, visibility: "everyone" },
        { churchId: "CHU00000001", category: "b1Tab", linkType: "plans", text: "Plans", sort: 21, visibility: "everyone" }
      ]
    })).json();
    linkIds = saved.map((l: any) => l.id);
  });

  test.afterAll(async () => {
    for (const id of linkIds) await ctx.delete(`${API}/content/links/${id}`, { headers });
    await ctx.dispose();
  });

  test("shows serving, groups and giving previews", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
    const main = page.locator("main");

    await expect(main.getByRole("heading", { name: "You're serving" })).toBeVisible({ timeout: 20000 });
    const serving = page.getByTestId("home-serving-row").first();
    await expect(serving).toContainText("Needs reply");
    await expect(serving.getByRole("button", { name: "Accept" })).toBeVisible();

    await expect(main.getByRole("heading", { name: "Your groups" })).toBeVisible();
    await expect(main.getByRole("link", { name: "All groups" })).toHaveAttribute("href", "/mobile/groups");

    await expect(page.getByTestId("home-giving-total")).toContainText(/\d/);
    await expect(page.getByTestId("home-giving-total")).toContainText(`Given in ${new Date().getFullYear()}`);
  });
});
