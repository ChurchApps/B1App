import { test, expect } from "@playwright/test";

test.describe("Standalone form submission (anonymous)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unrestricted form: anonymous parent can fill and submit", async ({ page }) => {
    const denied: string[] = [];
    page.on("console", (m) => { if (/access denied/i.test(m.text())) denied.push(m.text()); });

    let submitStatus = 0;
    page.on("response", (r) => {
      if (r.url().includes("/formsubmissions") && r.request().method() === "POST") submitStatus = r.status();
    });

    await page.goto("/forms/FRM00000004");

    const input = page.getByLabel(/Child Full Name/i);
    await expect(input).toBeVisible({ timeout: 15000 });
    await input.fill("Test Kid");
    await page.getByLabel(/Emergency Contact Phone/i).fill("555-1234");

    await expect(page.locator("body")).not.toContainText(/access denied/i);

    await page.locator("#formSubmissionBox").getByRole("button", { name: /submit|save/i }).click();

    await expect(page.locator("body")).toContainText("Your child is registered for Vacation Bible School! See you there.", { timeout: 15000 });
    expect(denied, "no access-denied error should appear").toHaveLength(0);
    expect(submitStatus, "POST /formsubmissions should be 200").toBe(200);
  });

  test("unrestricted form: shows the admin-authored description above the fields", async ({ page }) => {
    await page.goto("/forms/FRM00000004");

    const input = page.getByLabel(/Child Full Name/i);
    await expect(input).toBeVisible({ timeout: 15000 });

    const description = page.getByTestId("form-description");
    await expect(description).toBeVisible();
    await expect(description).toContainText("Register your child for Vacation Bible School");

    const [descriptionBox, inputBox] = await Promise.all([description.boundingBox(), input.boundingBox()]);
    expect(descriptionBox, "description should be rendered").not.toBeNull();
    expect(inputBox, "first field should be rendered").not.toBeNull();
    expect(descriptionBox!.y, "description should sit above the first field").toBeLessThan(inputBox!.y);
  });

  test("unrestricted form: shows the form's header photo above the description", async ({ page }) => {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
    const photoUrl = "https://content.example.com/CHU00000001/gallery/1.78/vbs-header.jpg";
    // The Api's photoUrl column has its own Jest coverage; here the saved value is layered onto the real response.
    await page.route(/\/forms\/standalone\/FRM00000004\?/, async (route) => {
      const response = await route.fetch();
      route.fulfill({ response, json: { ...(await response.json()), photoUrl } });
    });
    await page.route("**/vbs-header.jpg", (route) => route.fulfill({ contentType: "image/png", body: png }));

    await page.goto("/forms/FRM00000004");
    await expect(page.getByLabel(/Child Full Name/i)).toBeVisible({ timeout: 15000 });

    const photo = page.getByTestId("form-header-photo");
    await expect(photo).toBeVisible();
    await expect(photo).toHaveAttribute("src", photoUrl);
    await expect(photo).toHaveAttribute("alt", "VBS Registration (Public)");

    const [photoBox, descriptionBox] = await Promise.all([photo.boundingBox(), page.getByTestId("form-description").boundingBox()]);
    expect(photoBox!.y, "photo should sit above the description").toBeLessThan(descriptionBox!.y);
  });

  test("unrestricted form: no header photo when the form has none", async ({ page }) => {
    await page.goto("/forms/FRM00000004");
    await expect(page.getByLabel(/Child Full Name/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("form-header-photo")).toHaveCount(0);
  });

  test("unrestricted form: visitors do not see the Edit Form header", async ({ page }) => {
    await page.goto("/forms/FRM00000004");
    await expect(page.getByLabel(/Child Full Name/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Edit Form", { exact: true })).toHaveCount(0);
  });

  test("restricted form: anonymous parent is prompted to log in (not access-denied crash)", async ({ page }) => {
    await page.goto("/forms/FRM00000005");
    // FormPage shows a login link for restricted forms to anonymous users
    await expect(page.getByTestId("form-login-link")).toBeVisible({ timeout: 15000 });
  });
});
