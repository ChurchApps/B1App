import { test, expect } from "@playwright/test";

// Issue #1340: the "Ready To Take Your Next Step?" banner uses background: var(--primary), but the
// live site's theme never defined --primary, so the banner was transparent behind its light text.
test("palette defines --primary so primary-colored sections get a background", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByText("Welcome Home to Grace Community Church")).toBeVisible({ timeout: 30000 });

  const bg = await page.evaluate(() => {
    const div = document.createElement("div");
    div.className = "section sectionDark";
    div.style.background = "var(--primary)";
    document.querySelector(".page")?.appendChild(div);
    return getComputedStyle(div).backgroundColor;
  });
  expect(bg).toBe("rgb(42, 111, 151)");
});
