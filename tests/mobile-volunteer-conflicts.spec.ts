import { test, expect } from "@playwright/test";
import { getApi, apiCall, doingUrl, type ApiHandle } from "./helpers/api";

const MAIN_API = process.env.API_BASE || "http://localhost:8084";

// Sign up to serve flags an open position when the member already serves that day or has
// blocked it out. Display only: Sign Up stays enabled.
test.describe.configure({ mode: "serial" });

const ymd = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test.describe("Sign up to serve conflicts", () => {
  let demo: ApiHandle;
  let personId = "";
  const planIds: string[] = [];
  const blockoutIds: string[] = [];

  const createPlan = async (label: string, serviceDate: string) => {
    const [plan] = await (await apiCall(demo, "post", doingUrl("/plans"), [{ ministryId: "GRP0000000a", planTypeId: "PLT00000001", name: `E2E Conflict ${label} ${Date.now()}`, serviceDate, notes: "" }])).json();
    planIds.push(plan.id);
    return plan.id as string;
  };

  const createSignupPlan = async (label: string, serviceDate: string) => {
    const planId = await createPlan(label, serviceDate);
    const positionName = `E2E Conflict ${label} Greeter`;
    await apiCall(demo, "post", doingUrl("/positions"), [{ planId, categoryName: "Hospitality", name: positionName, count: 2, allowSelfSignup: true }]);
    return { planId, positionName };
  };

  test.beforeAll(async () => {
    demo = await getApi("demo");
    const login = await (await demo.request.post(MAIN_API + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" } })).json();
    personId = (login.userChurches || []).find((c: any) => c.church?.id === "CHU00000001")?.person?.id;
    expect(personId, "demo personId").toBeTruthy();
  });

  test.afterAll(async () => {
    for (const id of planIds) await apiCall(demo, "delete", doingUrl("/plans/" + id));
    for (const id of blockoutIds) await apiCall(demo, "delete", doingUrl("/blockoutDates/" + id));
    await demo?.request.dispose();
  });

  test("flags a position on a day the member already serves", async ({ page }) => {
    const day = ymd(2);
    const busyPlan = await createPlan("Busy", day);
    const [position] = await (await apiCall(demo, "post", doingUrl("/positions"), [{ planId: busyPlan, categoryName: "Conflict Team", name: "E2E Conflict Usher", count: 1 }])).json();
    await apiCall(demo, "post", doingUrl("/assignments"), [{ positionId: position.id, personId, status: "Accepted" }]);
    const signup = await createSignupPlan("SameDay", day);

    await page.goto(`/mobile/volunteer/${signup.planId}`);
    const main = page.locator("main");
    await expect(main.getByText(signup.positionName)).toBeVisible({ timeout: 30000 });
    await expect(main.getByTestId("signup-conflict-serving")).toHaveText("Serving that day");
    await expect(main.getByText("You're already serving that day: E2E Conflict Usher.")).toBeVisible();
    await expect(main.getByTestId("signup-conflict-blockout")).toHaveCount(0);
    await expect(main.getByRole("button", { name: /^Sign Up$/i }).first()).toBeEnabled();
  });

  test("flags a position inside a blockout range", async ({ page }) => {
    const day = ymd(9);
    const [blockout] = await (await apiCall(demo, "post", doingUrl("/blockoutDates"), [{ startDate: ymd(8), endDate: ymd(10) }])).json();
    blockoutIds.push(blockout.id);
    const signup = await createSignupPlan("Blockout", day);

    await page.goto(`/mobile/volunteer/${signup.planId}`);
    const main = page.locator("main");
    await expect(main.getByText(signup.positionName)).toBeVisible({ timeout: 30000 });
    await expect(main.getByTestId("signup-conflict-blockout")).toHaveText("Blocked out");
    await expect(main.getByText("This date is in your blockout dates.")).toBeVisible();
    await expect(main.getByRole("button", { name: /^Sign Up$/i }).first()).toBeEnabled();
  });

  test("shows no flag on a clear day", async ({ page }) => {
    const signup = await createSignupPlan("Clear", "2031-03-12");
    // Nothing else the demo user has may fall on that day; hide any stray rows from other specs.
    await page.route("**/doing/blockoutdates/my", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    await page.goto(`/mobile/volunteer/${signup.planId}`);
    const main = page.locator("main");
    await expect(main.getByText(signup.positionName)).toBeVisible({ timeout: 30000 });
    await expect(main.getByTestId("signup-conflict-serving")).toHaveCount(0);
    await expect(main.getByTestId("signup-conflict-blockout")).toHaveCount(0);
  });
});
