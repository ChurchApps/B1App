import { test, expect, APIRequestContext } from "@playwright/test";

// #1369: a service time still linked to an archived group crashed mobile check-in with a client-side exception.
test.describe("Mobile checkin with a stale group link", () => {
  const API = process.env.API_BASE || "http://localhost:8084";
  const EMMA = "PER00000085";
  const SERVICE = "SER00000001";
  const SERVICE_TIME = "SST00000001";
  let groupId = "";
  let linkId = "";

  const jwts = async (request: APIRequestContext) => {
    const res = await request.post(API + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" } });
    const church = (await res.json()).userChurches.find((c: any) => c.church.id === "CHU00000001");
    const jwt = (key: string) => ({ Authorization: "Bearer " + church.apis.find((a: any) => a.keyName === key).jwt });
    return { attendance: jwt("AttendanceApi"), membership: jwt("MembershipApi") };
  };

  const clearTodaysVisits = async (request: APIRequestContext, headers: any) => {
    const today = new Date().toLocaleDateString("en-CA");
    const visits = await (await request.get(API + "/attendance/visits?personId=" + EMMA, { headers })).json();
    for (const v of Array.isArray(visits) ? visits : []) {
      if (v.id && String(v.visitDate).slice(0, 10) === today) await request.delete(API + "/attendance/visits/" + v.id, { headers });
    }
  };

  test.beforeAll(async ({ request }) => {
    const h = await jwts(request);
    await clearTodaysVisits(request, h.attendance);
    const groups = await (await request.post(API + "/membership/groups", { headers: h.membership, data: [{ categoryName: "Children", name: "Zacchaeus Archived Room", trackAttendance: true, archived: true }] })).json();
    groupId = groups[0].id;
    const links = await (await request.post(API + "/attendance/groupservicetimes", { headers: h.attendance, data: [{ groupId, serviceTimeId: SERVICE_TIME }] })).json();
    linkId = links[0].id;
    const visit = { personId: EMMA, serviceId: SERVICE, visitSessions: [{ session: { serviceTimeId: SERVICE_TIME, groupId } }] };
    const res = await request.post(API + "/attendance/visits/checkin?serviceId=" + SERVICE + "&peopleIds=" + EMMA + "&acknowledgeWarnings=true", { headers: h.attendance, data: [visit] });
    expect(res.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    const h = await jwts(request);
    await clearTodaysVisits(request, h.attendance);
    if (linkId) await request.delete(API + "/attendance/groupservicetimes/" + linkId, { headers: h.attendance });
    if (groupId) await request.delete(API + "/membership/groups/" + groupId, { headers: h.membership });
  });

  test("the household step still renders when a service time links to an archived group", async ({ page }) => {
    await page.goto("/mobile/checkin");
    await page.getByTestId("select-service-" + SERVICE + "-button").click({ timeout: 30000 });
    await expect(page.getByTestId("checkin-submit-button")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Application error/i)).toHaveCount(0);
  });
});
