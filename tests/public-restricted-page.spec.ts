import { test, expect } from "@playwright/test";
import { apiCall, getApi, type ApiHandle } from "./helpers/api";

// A page whose Visibility isn't "Everyone": signed-out visitors get the members-only gate with a
// Login button, and signed-in people the page isn't shared with get the no-access message.

const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const URL_PATH = "/spec-group-only";

let api: ApiHandle;
let pageId: string | undefined;

test.beforeAll(async () => {
  api = await getApi("demo", "ContentApi");
  // "groups" with no groups ticked: nobody passes the gate, not even the demo admin.
  const res = await apiCall(api, "post", `${MAIN_API}/content/pages`, [{ url: URL_PATH, title: "Spec Group Only", layout: "headerFooter", visibility: "groups", groupIds: "[]" }]);
  expect(res.ok(), `create page: ${res.status()}`).toBe(true);
  pageId = (await res.json())?.[0]?.id;
});

test.afterAll(async () => {
  if (pageId) await apiCall(api, "delete", `${MAIN_API}/content/pages/${pageId}`);
});

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a members-only page asks the visitor to log in", async ({ page }) => {
    await page.goto(URL_PATH, { timeout: 60000 });
    await expect(page.getByText("This page is for church members")).toBeVisible({ timeout: 30000 });
    const login = page.getByTestId("restricted-login-button");
    await expect(login).toHaveText("Login");
    await expect(login).toHaveAttribute("href", new RegExp("^/login\\?returnUrl=.*spec-group-only"));
  });
});

test("a signed-in member the page isn't shared with is told they don't have access", async ({ page }) => {
  await page.goto(URL_PATH, { timeout: 60000 });
  await expect(page.getByText("You don't have access to this page")).toBeVisible({ timeout: 30000 });
});
