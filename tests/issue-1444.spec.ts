import { test, expect } from "@playwright/test";
import { getApi, apiCall, membershipUrl, type ApiHandle } from "./helpers/api";
import { DEMO_CHURCH } from "./helpers/fixtures";

const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";
const LAST_NAME = "Zebedeetitle";

// ChurchAppsSupport#1444: a Title row in the sign-up checklist asks each guest for Mr/Mrs/Dr and
// saves it to the same Title (name prefix) staff edit in People.
test.describe("QR guest registration title", () => {
  let api: ApiHandle;
  let originals: any[] = [];

  const loadSettings = async () => (await (await apiCall(api, "get", membershipUrl("/settings"))).json()) as any[];
  const saveSettings = async (values: Record<string, string>) => {
    const all = await loadSettings();
    const rows = Object.entries(values).map(([keyName, value]) => ({ ...(all.find((s) => s.keyName === keyName) || { churchId: DEMO_CHURCH.ID, keyName, public: 1 }), value }));
    expect((await apiCall(api, "post", membershipUrl("/settings"), rows)).ok()).toBeTruthy();
  };
  const findCreated = async () => ((await (await apiCall(api, "get", membershipUrl("/people/search?term=" + LAST_NAME))).json()) as any[]) || [];
  const removeCreated = async () => { for (const p of await findCreated()) await apiCall(api, "delete", membershipUrl("/people/" + p.id)); };

  test.beforeAll(async () => {
    api = await getApi("demo", "MembershipApi");
    originals = (await loadSettings()).filter((s) => ["enableQRGuestRegistration", "guestRegistrationFields"].includes(s.keyName));
    await removeCreated();
    await saveSettings({ enableQRGuestRegistration: "true", guestRegistrationFields: JSON.stringify({ title: "optional", email: "optional", phone: "off" }) });
  });

  test.afterAll(async () => {
    await removeCreated();
    await saveSettings({
      enableQRGuestRegistration: originals.find((s) => s.keyName === "enableQRGuestRegistration")?.value ?? "false",
      guestRegistrationFields: originals.find((s) => s.keyName === "guestRegistrationFields")?.value ?? "{}"
    });
    await api.request.dispose();
  });

  test("asks each guest for a title and saves it on the person", async ({ page }) => {
    await page.goto(BASE_URL + "/guest-register");
    await expect(page.getByRole("heading", { name: "Guest Registration" })).toBeVisible({ timeout: 20000 });
    const titles = page.getByRole("combobox", { name: /^Title/ });
    await expect(titles).toHaveCount(2, { timeout: 15000 });

    await titles.nth(0).click();
    await page.getByRole("option", { name: "Dr", exact: true }).click();
    await page.getByLabel(/^First Name/).nth(0).fill("Zadok");
    await page.getByLabel(/^Last Name/).nth(0).fill(LAST_NAME);
    await page.getByLabel(/^First Name/).nth(1).fill("Zara");
    await page.getByLabel(/^Last Name/).nth(1).fill(LAST_NAME);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Registration Complete")).toBeVisible({ timeout: 15000 });

    const people = await findCreated();
    expect(people.find((p) => p.name?.first === "Zadok")?.name?.prefix).toBe("Dr");
    expect(people.find((p) => p.name?.first === "Zara")?.name?.prefix || "").toBe("");
  });
});
