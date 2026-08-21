import { test, expect } from "@playwright/test";

// Issue #1001: tenant pages streamed a full-looking document but the response was
// HTTP 500 - the RSC pass succeeded while the HTML render threw, so Next served its
// error shell (<html id="__next_error__">) and the browser re-rendered the real page
// from the inlined flight data. Assert both halves: the status code and the shell.
test.describe("Issue 1001 - tenant pages return 200, not an error shell", () => {
  for (const path of ["/", "/about"]) {
    test(`${path} renders without Next's error shell`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).not.toHaveAttribute("id", "__next_error__");
    });
  }
});
