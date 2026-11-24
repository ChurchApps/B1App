import { test, expect } from "@playwright/test";
import { getApi, apiCall, doingUrl, type ApiHandle } from "./helpers/api";

// Plans > Scheduling preferences: the member edits their own max per month, preferred service
// times and household setting, saved to their own schedulingPreferences row.
test.describe.configure({ mode: "serial" });

test.describe("Mobile plans scheduling preferences", () => {
  let demo: ApiHandle;
  let original: any = null;

  const mine = async () => {
    const res = await apiCall(demo, "get", doingUrl("/schedulingPreferences/my"));
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };

  test.beforeAll(async () => {
    demo = await getApi("demo");
    original = await mine();
    if (original?.id) await apiCall(demo, "delete", doingUrl("/schedulingPreferences/" + original.id));
  });

  test.afterAll(async () => {
    const current = await mine();
    if (current?.id) await apiCall(demo, "delete", doingUrl("/schedulingPreferences/" + current.id));
    if (original) await apiCall(demo, "post", doingUrl("/schedulingPreferences"), [{ maxPerMonth: original.maxPerMonth ?? null, preferredTimes: original.preferredTimes ?? "", householdScheduling: original.householdScheduling ?? "none" }]);
    await demo?.request.dispose();
  });

  test("sets, shows and clears the member's own preferences", async ({ page }) => {
    await page.goto("/mobile/plans");
    const section = page.getByTestId("plans-preferences");
    await expect(section).toContainText("Scheduling preferences", { timeout: 30000 });
    await expect(section).toContainText("No preferences set.");

    await page.getByTestId("plans-preferences-edit").click();
    const sheet = page.getByRole("dialog", { name: "Scheduling preferences" });
    const max = sheet.getByTestId("plans-preferences-max");
    await max.fill("0");
    await expect(sheet.getByText("Enter a whole number of 1 or more, or leave it blank.")).toBeVisible();
    await expect(sheet.getByTestId("plans-preferences-save")).toBeDisabled();

    await max.fill("2");
    await sheet.getByTestId("plans-preferences-times").fill("9:00 am, First Service");
    await sheet.getByTestId("plans-preferences-household").click();
    await page.getByRole("option", { name: "Not on the same day" }).click();
    await sheet.getByTestId("plans-preferences-save").click();
    await expect(sheet).toBeHidden({ timeout: 15000 });

    await expect(section).toContainText("2");
    await expect(section).toContainText("9:00 am, First Service");
    await expect(section).toContainText("Not on the same day");
    const saved = await mine();
    expect(saved).toMatchObject({ maxPerMonth: 2, preferredTimes: "9:00 am, First Service", householdScheduling: "apart" });

    // Blank limit clears it; the row stays the member's one row.
    await page.getByTestId("plans-preferences-edit").click();
    await expect(sheet.getByTestId("plans-preferences-max")).toHaveValue("2");
    await sheet.getByTestId("plans-preferences-max").fill("");
    await sheet.getByTestId("plans-preferences-save").click();
    await expect(sheet).toBeHidden({ timeout: 15000 });
    await expect(section).toContainText("No limit");
    const cleared = await mine();
    expect(cleared.id).toBe(saved.id);
    expect(cleared.maxPerMonth ?? null).toBeNull();
  });

  test("a failed save keeps the sheet open with an error", async ({ page }) => {
    await page.route("**/doing/schedulingPreferences", (route) => route.request().method() === "POST"
      ? route.fulfill({ status: 500, contentType: "application/json", body: "{}" })
      : route.continue());
    await page.goto("/mobile/plans");
    await page.getByTestId("plans-preferences-edit").click({ timeout: 30000 });
    const sheet = page.getByRole("dialog", { name: "Scheduling preferences" });
    await sheet.getByTestId("plans-preferences-max").fill("3");
    await sheet.getByTestId("plans-preferences-save").click();
    await expect(sheet.getByRole("alert")).toHaveText("Couldn't save your preferences. Try again.");
    await expect(sheet).toBeVisible();
  });
});
