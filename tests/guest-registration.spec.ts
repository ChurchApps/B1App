import { test, expect } from "@playwright/test";
import { getApi, apiCall, membershipUrl, messagingUrl, type ApiHandle } from "./helpers/api";
import { DEMO_CHURCH } from "./helpers/fixtures";

const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";
const LAST_NAME = "Zebedeevisitor";

// QR sign-up (ChurchAppsSupport#1354): the church's checklist decides which profile fields the
// /guest-register page asks for, and everyone it creates is filed as a Visitor.
test.describe("QR guest registration", () => {
  test.describe.configure({ mode: "serial" });
  let api: ApiHandle;
  let originals: any[] = [];

  const loadSettings = async () => (await (await apiCall(api, "get", membershipUrl("/settings"))).json()) as any[];
  const saveSettings = async (values: Record<string, string>) => {
    const all = await loadSettings();
    const rows = Object.entries(values).map(([keyName, value]) => ({ ...(all.find((s) => s.keyName === keyName) || { churchId: DEMO_CHURCH.ID, keyName, public: 1 }), value }));
    const res = await apiCall(api, "post", membershipUrl("/settings"), rows);
    expect(res.ok()).toBeTruthy();
  };
  const findCreated = async () => ((await (await apiCall(api, "get", membershipUrl("/people/search?term=" + LAST_NAME))).json()) as any[]) || [];
  const removeCreated = async () => {
    for (const p of await findCreated()) await apiCall(api, "delete", membershipUrl("/people/" + p.id));
  };

  test.beforeAll(async () => {
    api = await getApi("demo", "MembershipApi");
    const all = await loadSettings();
    originals = all.filter((s) => ["enableQRGuestRegistration", "guestRegistrationFields", "guestRegistrationImage"].includes(s.keyName));
    await removeCreated();
    await saveSettings({
      enableQRGuestRegistration: "true",
      guestRegistrationFields: JSON.stringify({ email: "optional", phone: "off", address: "required", birthDate: "optional", gender: "optional", maritalStatus: "optional", grade: "optional" })
    });
  });

  test.afterAll(async () => {
    await removeCreated();
    await saveSettings({
      enableQRGuestRegistration: originals.find((s) => s.keyName === "enableQRGuestRegistration")?.value ?? "false",
      guestRegistrationFields: originals.find((s) => s.keyName === "guestRegistrationFields")?.value ?? "{}",
      guestRegistrationImage: originals.find((s) => s.keyName === "guestRegistrationImage")?.value ?? ""
    });
    await api.request.dispose();
  });

  test("asks for the fields the church included and hides the ones it turned off", async ({ page }) => {
    await page.goto(BASE_URL + "/guest-register");
    await expect(page.getByRole("heading", { name: "Guest Registration" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Home Address")).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel(/Street Address/)).toBeVisible();
    await expect(page.getByRole("combobox", { name: /Marital Status/ })).toHaveCount(1);
    // Per-person fields show on every card; phone is turned off.
    await expect(page.getByLabel(/Birth Date/)).toHaveCount(2);
    await expect(page.getByRole("combobox", { name: /Gender/ })).toHaveCount(2);
    await expect(page.getByRole("combobox", { name: /Grade/ })).toHaveCount(2);
    await expect(page.getByLabel(/^Phone/)).toHaveCount(0);
  });

  test("blocks submit until required fields are filled, then files the family as Visitors", async ({ page }) => {
    await page.goto(BASE_URL + "/guest-register");
    await expect(page.getByLabel(/Street Address/)).toBeVisible({ timeout: 20000 });

    const firstNames = page.getByLabel(/^First Name/);
    const lastNames = page.getByLabel(/^Last Name/);
    await firstNames.nth(0).fill("Zacchaeus");
    await lastNames.nth(0).fill(LAST_NAME);
    await firstNames.nth(1).fill("Zebedee");
    await lastNames.nth(1).fill(LAST_NAME);
    await page.getByLabel(/^Email/).fill("zacchaeus.visitor@example.com");

    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Please fill in every required field.")).toBeVisible();

    await page.getByLabel(/Street Address/).fill("12 Sycamore Ln");
    await page.getByLabel(/^City/).fill("Jericho");
    await page.getByLabel(/^State/).fill("TX");
    await page.getByLabel(/^Zip/).fill("75001");
    await page.getByLabel(/Birth Date/).nth(0).fill("1985-06-15");
    await page.getByRole("combobox", { name: /Gender/ }).nth(0).click();
    await page.getByRole("option", { name: "Male", exact: true }).click();
    await page.getByRole("combobox", { name: /Marital Status/ }).click();
    await page.getByRole("option", { name: "Married", exact: true }).click();
    await page.getByRole("combobox", { name: /Grade/ }).nth(1).click();
    await page.getByRole("option", { name: "3", exact: true }).click();

    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Registration Complete")).toBeVisible({ timeout: 15000 });

    const people = await findCreated();
    expect(people).toHaveLength(2);
    const head = people.find((p) => p.name?.first === "Zacchaeus");
    const child = people.find((p) => p.name?.first === "Zebedee");
    expect(head.membershipStatus).toBe("Visitor");
    expect(child.membershipStatus).toBe("Visitor");
    expect(head.contactInfo).toMatchObject({ email: "zacchaeus.visitor@example.com", address1: "12 Sycamore Ln", city: "Jericho", state: "TX", zip: "75001" });
    expect(head.gender).toBe("Male");
    expect(head.maritalStatus).toBe("Married");
    expect(String(head.birthDate)).toContain("1985-06-15");
    expect(child.contactInfo).toMatchObject({ address1: "12 Sycamore Ln", city: "Jericho", state: "TX", zip: "75001" });
    expect(child.grade).toBe("3");
  });
  // ChurchAppsSupport#1374: a Comments box the church can include, saved as a note on the head of household.
  test("asks for comments when the church included them and saves them as a note", async ({ page }) => {
    await removeCreated();
    await saveSettings({ guestRegistrationFields: JSON.stringify({ email: "optional", phone: "off", comments: "required" }) });
    await page.goto(BASE_URL + "/guest-register");
    const comments = page.getByLabel(/^Comments/);
    await expect(comments).toBeVisible({ timeout: 20000 });

    await page.getByLabel(/^First Name/).nth(0).fill("Zelda");
    await page.getByLabel(/^Last Name/).nth(0).fill(LAST_NAME);
    await page.getByLabel(/^First Name/).nth(1).fill("Zion");
    await page.getByLabel(/^Last Name/).nth(1).fill(LAST_NAME);

    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Please fill in every required field.")).toBeVisible();
    await comments.fill("Met you at the church picnic");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Registration Complete")).toBeVisible({ timeout: 15000 });

    const head = (await findCreated()).find((p) => p.name?.first === "Zelda");
    expect(head?.conversationId).toBeTruthy();
    const messaging = await getApi("demo", "MessagingApi");
    const messages = (await (await apiCall(messaging, "get", messagingUrl("/messages/conversation/" + head.conversationId))).json()) as any[];
    await messaging.request.dispose();
    expect(messages.map((m) => m.content)).toContain("Met you at the church picnic");
  });

  // ChurchAppsSupport#1375: the church's header photo replaces the icon at the top of the sign-up page.
  test("shows the church's header photo in place of the icon", async ({ page }) => {
    await page.goto(BASE_URL + "/guest-register");
    await expect(page.getByRole("heading", { name: "Guest Registration" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("guest-register-header-photo")).toHaveCount(0);
    await expect(page.getByText("person_add")).toBeVisible();

    const imageUrl = BASE_URL + "/images/about-bg.jpg";
    await saveSettings({ guestRegistrationImage: imageUrl });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Guest Registration" })).toBeVisible({ timeout: 20000 });
    const photo = page.getByTestId("guest-register-header-photo");
    await expect(photo).toHaveAttribute("src", imageUrl, { timeout: 20000 });
    await expect(photo).toBeVisible();
    await expect(page.getByText("person_add")).toHaveCount(0);
    await page.screenshot({ path: ".pr-screenshots/after.png" });
  });
});
