import { test, expect, type Page } from "@playwright/test";
import { getApi, apiCall, membershipUrl, doingUrl, type ApiHandle } from "./helpers/api";
import { DEMO_CHURCH } from "./helpers/fixtures";

// A household adult (demo@b1.church is the Head of the User Family) can send staff changes for a
// child in the household. The change is a directoryUpdate task; the child's record is untouched
// until staff apply it. Only offered when the church has a Directory Approval Group.
const DEMO_PERSON_ID = "PER00000082";
const SPOUSE_ID = "PER00000083"; // Jane User
const CHILD_ID = "PER00000084"; // Alex User, born 2015-08-20
const APPROVAL_GROUP_ID = "GRP00000001";

test.describe.configure({ mode: "serial" });

interface Setting { id?: string; churchId?: string; keyName: string; value?: string; public?: number }
interface TaskRow { id: string; createdById?: string }

test.describe("Mobile profile household member edits", () => {
  let api: ApiHandle;
  let doing: ApiHandle;
  let previousSetting: Setting | undefined;

  const loadSetting = async () => ((await (await apiCall(api, "get", membershipUrl("/settings"))).json()) as Setting[]).find((s) => s.keyName === "directoryApprovalGroupId");
  const saveSetting = async (value: string) => {
    const existing = await loadSetting();
    const res = await apiCall(api, "post", membershipUrl("/settings"), [{ ...(existing || { churchId: DEMO_CHURCH.ID, keyName: "directoryApprovalGroupId", public: 1 }), value }]);
    expect(res.ok()).toBeTruthy();
  };
  const openChildRequests = async () => ((await (await apiCall(doing, "get", doingUrl("/tasks/directoryUpdate/" + CHILD_ID))).json()) as TaskRow[]) || [];

  // The mobile query cache is persisted; drop it so the page reads the current approval setting.
  const openProfile = async (page: Page, path = "/mobile/profileEdit") => {
    await page.goto(path);
    await page.evaluate(async () => {
      for (const db of await indexedDB.databases()) if (db.name) indexedDB.deleteDatabase(db.name);
    });
    await page.reload();
  };

  test.beforeAll(async () => {
    api = await getApi("demo", "MembershipApi");
    doing = await getApi("demo", "DoingApi");
    previousSetting = await loadSetting();
    await saveSetting(APPROVAL_GROUP_ID);
  });

  test.afterAll(async () => {
    for (const t of await openChildRequests()) await apiCall(doing, "delete", doingUrl("/tasks/" + t.id));
    await saveSetting(previousSetting?.value || "");
    await api.request.dispose();
    await doing.request.dispose();
  });

  test("offers Edit for a child in the household but not for the spouse", async ({ page }) => {
    await openProfile(page);
    await expect(page.getByTestId("household-member-edit-" + CHILD_ID)).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("household-member-edit-" + SPOUSE_ID)).toHaveCount(0);
  });

  test("a child's birth date goes to staff for approval and the record is unchanged", async ({ page }) => {
    for (const t of await openChildRequests()) await apiCall(doing, "delete", doingUrl("/tasks/" + t.id));
    await openProfile(page);
    await page.getByTestId("household-member-edit-" + CHILD_ID).click({ timeout: 30000 });
    await expect(page.locator("main")).toContainText("Changes for this family member go to church staff for approval.", { timeout: 30000 });
    await expect(page.locator("main").getByRole("heading", { name: "Household", exact: true })).toHaveCount(0);

    await page.getByTestId("profile-edit-contact").click();
    const sheet = page.getByRole("dialog");
    await sheet.getByLabel("Birth Date").fill("2015-08-21");
    const submitted = page.waitForRequest((r) => r.method() === "POST" && r.url().includes("/tasks?type=directoryUpdate"), { timeout: 30000 });
    await sheet.getByRole("button", { name: "Submit for Approval" }).click();
    const [task] = (await submitted).postDataJSON();
    expect(task).toMatchObject({ associatedWithId: CHILD_ID, createdById: DEMO_PERSON_ID, assignedToId: APPROVAL_GROUP_ID, status: "Open" });
    expect(JSON.parse(task.data)).toEqual([expect.objectContaining({ field: "birthDate", value: "2015-08-21" })]);
    await expect(page.getByText("Your changes have been submitted for approval.")).toBeVisible({ timeout: 15000 });

    const child = await (await apiCall(api, "get", membershipUrl("/people/" + CHILD_ID))).json();
    expect(String(child.birthDate)).toContain("2015-08-20");
    const requests = await openChildRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].createdById).toBe(DEMO_PERSON_ID);
  });

  test("an adult household member's profile cannot be edited from the app", async ({ page }) => {
    await openProfile(page, "/mobile/profileEdit?personId=" + SPOUSE_ID);
    await expect(page.getByTestId("household-member-not-editable")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("profile-edit-contact")).toHaveCount(0);
  });

  test("no Edit action when the church has no approval group", async ({ page }) => {
    await saveSetting("");
    try {
      await openProfile(page);
      await expect(page.locator("main")).toContainText(/Alex/, { timeout: 30000 });
      await expect(page.getByTestId("household-member-edit-" + CHILD_ID)).toHaveCount(0);
    } finally {
      await saveSetting(APPROVAL_GROUP_ID);
    }
  });
});
