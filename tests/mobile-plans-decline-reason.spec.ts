import { test, expect } from "@playwright/test";
import { getApi, apiCall, doingUrl, membershipUrl } from "./helpers/api";

// A volunteer can say why they are declining; the reason is optional, one line, and saved on the assignment.
test.describe("Mobile plans decline reason", () => {
  test("Decline sends the typed reason and it is saved on the assignment", async ({ page }) => {
    const demo = await getApi("demo");
    const login = await (await demo.request.post(membershipUrl("/users/login"), { data: { email: "demo@b1.church", password: "password" } })).json();
    const personId = (login.userChurches || []).find((c: { church?: { id?: string } }) => c.church?.id === "CHU00000001")?.person?.id;
    expect(personId, "demo personId").toBeTruthy();
    let planId = "";
    try {
      const plan = await (await apiCall(demo, "post", doingUrl("/plans"), [{ ministryId: "GRP0000000a", planTypeId: "PLT00000001", name: "Decline Reason " + Date.now(), serviceDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), notes: "", serviceOrder: true }])).json();
      planId = plan[0].id;
      const pos = await (await apiCall(demo, "post", doingUrl("/positions"), [{ planId, categoryName: "Greeters", name: "Door Greeter", count: 1, groupId: "GRP0000000b" }])).json();
      const assignment = await (await apiCall(demo, "post", doingUrl("/assignments"), [{ positionId: pos[0].id, personId, status: "Unconfirmed" }])).json();
      const assignmentId = assignment[0].id;

      await page.goto("/mobile/plans/" + planId);
      await page.getByRole("button", { name: "Decline" }).first().click({ timeout: 30000 });
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Reason (optional)").fill("  Out of town that weekend  ");
      const decline = page.waitForRequest((r) => r.method() === "POST" && r.url().includes("/assignments/decline/" + assignmentId));
      await dialog.getByRole("button", { name: "Decline" }).click();
      expect((await decline).postDataJSON()).toEqual({ declineReason: "Out of town that weekend" });
      await expect(page.getByText("Declined", { exact: true }).first()).toBeVisible({ timeout: 15000 });

      const saved = await (await apiCall(demo, "get", doingUrl("/assignments/" + assignmentId))).json();
      expect(saved.status).toBe("Declined");
      expect(saved.declineReason).toBe("Out of town that weekend");
    } finally {
      if (planId) await apiCall(demo, "delete", doingUrl("/plans/" + planId));
      await demo.request.dispose();
    }
  });
});
