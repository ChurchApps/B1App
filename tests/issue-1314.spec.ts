import { test, expect, request } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// Issue #1314: the mobile Directory showed "Members Only" to people the Api lets
// see the directory. demo@b1.church is a Domain Admin whose own status is Member,
// so with Show in Directory = Staff the Api returns the list but the screen hid it.
test.describe.configure({ mode: "serial" });

const API = process.env.API_BASE || "http://localhost:8084";

async function setDirectoryVisibility(value: string) {
  const ctx = await request.newContext();
  const login = await ctx.post(API + "/membership/users/login", {
    data: { email: "demo@b1.church", password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const body = await login.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID);
  const jwt = uc?.apis?.find((a: any) => a.keyName === "MembershipApi")?.jwt;
  if (!jwt) throw new Error("MembershipApi JWT not present");
  const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
  const settings = await (await ctx.get(API + "/membership/settings", { headers })).json();
  const setting = (settings || []).find((x: any) => x.keyName === "directoryVisibility")
    || { churchId: DEMO_CHURCH.ID, public: 1, keyName: "directoryVisibility" };
  setting.value = value;
  const res = await ctx.post(API + "/membership/settings", { headers, data: [setting] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  await ctx.dispose();
}

test("an admin sees the mobile directory when Show in Directory is Staff", async ({ page }) => {
  await setDirectoryVisibility("Staff");
  try {
    await page.goto("/mobile/community");
    await expect(page.getByRole("textbox", { name: /Search Members/i })).toBeVisible({ timeout: 30000 });
    await expect(page.locator("main")).toContainText(/Donald/, { timeout: 30000 });
    await expect(page.getByText("Members Only")).toHaveCount(0);
  } finally {
    await setDirectoryVisibility("Members");
  }
});
