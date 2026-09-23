import { test, expect } from "@playwright/test";

// Issue #1119 — raw locale keys leak into the mobile UI.
// The Contact Group Leader form labelled its fields with "groups.firstName",
// "groups.lastName", "groups.email", "groups.phone" and "groups.message", and the
// drawer's dark-mode toggle rendered "mobile.components.lightMode". None of those
// keys exist in the locale files, and Locale.label() falls back to the key itself.

// GRP00000005 "Young Adults Class" is public and led by Michael Davis, so the
// anonymous group page renders the contact-leader form.
const PUBLIC_GROUP_SLUG = "young-adults-class";

const CONTACT_KEYS = ["groups.firstName", "groups.lastName", "groups.email", "groups.phone", "groups.message"];

test.describe("Issue 1119 — contact group leader form", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("field labels are translated, not raw locale keys", async ({ page }) => {
    await page.goto(`/mobile/groups/${PUBLIC_GROUP_SLUG}`);

    const main = page.locator("main");
    await expect(main.getByTestId("group-contact-first-name-input")).toBeVisible({ timeout: 30000 });

    for (const key of CONTACT_KEYS) {
      await expect(main, `"${key}" must never render as literal text`).not.toContainText(key);
    }
  });
});

test.describe("Issue 1119 — drawer dark-mode toggle", () => {
  test.use({ colorScheme: "dark" });

  test("toggle label is translated, not a raw mobile.components key", async ({ page }) => {
    await page.goto("/mobile/dashboard");

    const nav = page.getByRole("navigation", { name: /Main navigation/i }).first();
    await expect(nav).toBeVisible({ timeout: 30000 });

    const toggle = nav.getByRole("button").filter({ hasText: /Mode|mobile\.components\./i }).first();
    await expect(toggle).toBeVisible({ timeout: 15000 });
    await expect(toggle, '"mobile.components.lightMode" must never render as literal text').not.toContainText("mobile.components.");
    await expect(toggle, "the dark-mode toggle needs a translated accessible name").not.toHaveAttribute("aria-label", /mobile\.components\./);
  });
});
