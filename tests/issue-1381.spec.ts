import { test, expect, request } from "@playwright/test";

// Issue #1381: the member's printed giving statement showed each gift a day early west of UTC.
test.describe.serial("Issue #1381 printed statement gift dates", () => {
  test.use({ timezoneId: "America/Chicago" });

  const MAIN_API = process.env.API_BASE || "http://localhost:8084";
  const DEMO_PERSON_ID = "PER00000082";
  const year = new Date().getFullYear();
  const giftDate = `${year}-03-15`;
  const created: { batch?: string; donation?: string } = {};

  const apiAuth = async (ctx: Awaited<ReturnType<typeof request.newContext>>) => {
    const res = await ctx.post(`${MAIN_API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
    const body = await res.json();
    const uc = (body.userChurches || []).find((c: any) => c.church?.id === "CHU00000001");
    return { headers: { Authorization: `Bearer ${uc.jwt}` } };
  };

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const auth = await apiAuth(ctx);
    const [batch] = await (await ctx.post(`${MAIN_API}/giving/donationbatches`, { ...auth, data: [{ name: "Issue 1381 Batch", batchDate: giftDate }] })).json();
    created.batch = batch.id;
    const [donation] = await (await ctx.post(`${MAIN_API}/giving/donations`, {
      ...auth,
      data: [{ batchId: batch.id, personId: DEMO_PERSON_ID, donationDate: giftDate, amount: 13.81, method: "Check", methodDetails: "1381" }]
    })).json();
    created.donation = donation.id;
    const fd = await ctx.post(`${MAIN_API}/giving/funddonations`, { ...auth, data: [{ donationId: donation.id, fundId: "FUN00000001", amount: 13.81 }] });
    expect(fd.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await request.newContext();
    const auth = await apiAuth(ctx);
    if (created.donation) await ctx.delete(`${MAIN_API}/giving/donations/${created.donation}`, auth);
    if (created.batch) await ctx.delete(`${MAIN_API}/giving/donationbatches/${created.batch}`, auth);
    await ctx.dispose();
  });

  test("statement row shows the recorded gift date", async ({ page }) => {
    await page.addInitScript(() => {
      window.print = () => {};
      window.close = () => {};
      window.history.back = () => {};
      window.history.go = () => {};
    });
    await page.goto(`/mobile/donate/print?year=${year}`);
    const row = page.locator("tr").filter({ hasText: "13.81" });
    await expect(row).toHaveCount(1, { timeout: 30000 });
    await expect(row.locator("td").first()).toHaveText(`Mar 15, ${year}`);
  });
});
