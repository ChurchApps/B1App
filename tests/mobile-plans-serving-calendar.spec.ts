import { test, expect } from "@playwright/test";
import { getApi, apiCall, doingUrl, membershipUrl } from "./helpers/api";

const feedUrl = (link: { churchId: string; personId: string; token: string }) =>
  doingUrl(`/assignments/public/calendar?churchId=${link.churchId}&personId=${link.personId}&token=${encodeURIComponent(link.token)}`);

// The Plans page offers a personal serving calendar feed of accepted assignments, and Reset link revokes the old URL.
test.describe("Mobile plans serving calendar", () => {
  test("the feed lists only accepted assignments and Reset link revokes the old URL", async ({ page }) => {
    const demo = await getApi("demo");
    const login = await (await demo.request.post(membershipUrl("/users/login"), { data: { email: "demo@b1.church", password: "password" } })).json();
    const personId = (login.userChurches || []).find((c: { church?: { id?: string } }) => c.church?.id === "CHU00000001")?.person?.id;
    expect(personId, "demo personId").toBeTruthy();
    const stamp = Date.now();
    let planId = "";
    try {
      const plan = await (await apiCall(demo, "post", doingUrl("/plans"), [{ ministryId: "GRP0000000a", planTypeId: "PLT00000001", name: "Feed Plan " + stamp, serviceDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), notes: "", serviceOrder: true }])).json();
      planId = plan[0].id;
      const positions = await (await apiCall(demo, "post", doingUrl("/positions"), [
        { planId, categoryName: "Greeters", name: "Feed Greeter " + stamp, count: 1, groupId: "GRP0000000b" },
        { planId, categoryName: "Greeters", name: "Feed Usher " + stamp, count: 1, groupId: "GRP0000000b" }
      ])).json();
      await apiCall(demo, "post", doingUrl("/assignments"), [
        { positionId: positions[0].id, personId, status: "Accepted" },
        { positionId: positions[1].id, personId, status: "Unconfirmed" }
      ]);

      const link = await (await apiCall(demo, "get", doingUrl("/assignments/my/calendar"))).json();
      expect(link.token).toBeTruthy();
      expect(link.token).not.toBe(personId);
      const feed = await demo.request.get(feedUrl(link));
      expect(feed.status()).toBe(200);
      expect(feed.headers()["content-type"]).toContain("text/calendar");
      const ics = (await feed.text()).replace(/\r\n[ \t]/g, "");
      expect(ics).toContain("Feed Greeter " + stamp);
      expect(ics).not.toContain("Feed Usher " + stamp);

      expect((await demo.request.get(feedUrl({ ...link, token: link.token.slice(0, -2) + "zz" }))).status()).toBe(401);

      await page.goto("/mobile/plans");
      const section = page.getByTestId("plans-serving-calendar");
      await expect(section.getByRole("button", { name: "Subscribe" })).toBeVisible({ timeout: 30000 });
      const reset = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/assignments/my/calendar/reset"));
      await section.getByRole("button", { name: "Reset link" }).click();
      expect((await reset).ok()).toBeTruthy();
      await expect(section.getByRole("status")).toContainText("Link reset");

      expect((await demo.request.get(feedUrl(link))).status()).toBe(401);
      const fresh = await (await apiCall(demo, "get", doingUrl("/assignments/my/calendar"))).json();
      expect(fresh.token).not.toBe(link.token);
      expect((await demo.request.get(feedUrl(fresh))).status()).toBe(200);
    } finally {
      if (planId) await apiCall(demo, "delete", doingUrl("/plans/" + planId));
      await demo.request.dispose();
    }
  });
});
