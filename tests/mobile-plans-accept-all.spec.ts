import { test, expect, type Page } from "@playwright/test";
import { getApi, apiCall, doingUrl, type ApiHandle } from "./helpers/api";

const MAIN_API = process.env.API_BASE || "http://localhost:8084";

// "Accept all" on Plans answers every pending request in one tap. Each test seeds its own plan with
// unconfirmed requests for the demo user; accepts for anything else (the shared seed) are answered
// in the browser so other specs keep their pending rows.
test.describe("Mobile plans Accept all", () => {
  let demo: ApiHandle;
  let personId = "";
  const planIds: string[] = [];

  const seedRequests = async (label: string, names: string[]) => {
    const plan = await (await apiCall(demo, "post", doingUrl("/plans"), [{ ministryId: "GRP0000000a", planTypeId: "PLT00000001", name: `${label} ${Date.now()}`, serviceDate: "2030-06-01", notes: "", serviceOrder: true }])).json();
    const planId = plan[0].id as string;
    planIds.push(planId);
    const positions = await (await apiCall(demo, "post", doingUrl("/positions"), names.map((name) => ({ planId, categoryName: "Accept All Team", name, count: 1 })))).json();
    const assignments = await (await apiCall(demo, "post", doingUrl("/assignments"), positions.map((p: any) => ({ positionId: p.id, personId, status: "Unconfirmed" })))).json();
    return assignments.map((a: any) => a.id as string);
  };

  const statusOf = async (assignmentId: string) => {
    const rows: any[] = await (await apiCall(demo, "get", doingUrl("/assignments/my"))).json();
    return rows.find((r) => r.id === assignmentId)?.status;
  };

  // Only the seeded requests reach the Api; failIds answer 500.
  const routeAccepts = async (page: Page, ownIds: string[], failIds: string[] = []) => {
    await page.route("**/doing/assignments/accept/**", async (route) => {
      const id = route.request().url().split("/").pop() || "";
      if (failIds.includes(id)) return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      if (ownIds.includes(id)) return route.continue();
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
  };

  test.beforeAll(async () => {
    demo = await getApi("demo");
    const login = await (await demo.request.post(MAIN_API + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" } })).json();
    personId = (login.userChurches || []).find((c: any) => c.church?.id === "CHU00000001")?.person?.id;
    expect(personId, "demo personId").toBeTruthy();
  });

  test.afterAll(async () => {
    for (const id of planIds) await apiCall(demo, "delete", doingUrl("/plans/" + id));
    await demo?.request.dispose();
  });

  test("accepts every pending request and clears Needs your reply", async ({ page }) => {
    const ids = await seedRequests("Accept All", ["AcceptAll Usher", "AcceptAll Greeter"]);
    await routeAccepts(page, ids);
    await page.goto("/mobile/plans");
    const needsReply = page.getByRole("region", { name: "Needs your reply" });
    await expect(needsReply).toContainText("AcceptAll Usher", { timeout: 30000 });
    await expect(needsReply).toContainText("AcceptAll Greeter");

    await needsReply.getByTestId("plans-accept-all").click();
    await expect(needsReply.getByText(/AcceptAll Usher|AcceptAll Greeter/)).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(await statusOf(ids[0])).toBe("Accepted");
    expect(await statusOf(ids[1])).toBe("Accepted");
  });

  test("a failed accept stays pending and says how many went through", async ({ page }) => {
    const ids = await seedRequests("Accept Partial", ["AcceptPartial Usher", "AcceptPartial Greeter"]);
    await routeAccepts(page, ids, [ids[1]]);
    await page.goto("/mobile/plans");
    const needsReply = page.getByRole("region", { name: "Needs your reply" });
    await expect(needsReply).toContainText("AcceptPartial Greeter", { timeout: 30000 });

    await needsReply.getByTestId("plans-accept-all").click();
    await expect(needsReply.getByRole("alert")).toHaveText(/^Accepted \d+ of \d+\./, { timeout: 15000 });
    await expect(needsReply).toContainText("AcceptPartial Greeter");
    await expect(needsReply.getByText("AcceptPartial Usher")).toHaveCount(0);
    expect(await statusOf(ids[0])).toBe("Accepted");
    expect(await statusOf(ids[1])).toBe("Unconfirmed");
  });

  test("one pending request shows no Accept all", async ({ page }) => {
    const [id] = await seedRequests("Accept One", ["AcceptOne Usher"]);
    // Hide every other pending request so this one is alone.
    await page.route("**/doing/assignments/my", async (route) => {
      const res = await route.fetch();
      const rows: any[] = await res.json();
      await route.fulfill({ response: res, json: rows.filter((r) => r.id === id || (r.status || "").toLowerCase() !== "unconfirmed") });
    });
    await page.goto("/mobile/plans");
    const needsReply = page.getByRole("region", { name: "Needs your reply" });
    await expect(needsReply).toContainText("AcceptOne Usher", { timeout: 30000 });
    await expect(needsReply.getByRole("button", { name: "Accept", exact: true })).toBeVisible();
    await expect(page.getByTestId("plans-accept-all")).toHaveCount(0);
  });
});
