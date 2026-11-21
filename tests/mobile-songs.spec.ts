import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile songs", () => {
  test("songs page lists the church's song library with keys", async ({ page }) => {
    await page.goto("/mobile/songs");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Songs" })).toBeVisible({ timeout: 15000 });
    const main = page.locator("main");
    await expect(main.getByTestId("song-row").filter({ hasText: "What a Beautiful Name" })).toBeVisible({ timeout: 30000 });
    await expect(main.getByTestId("song-row").filter({ hasText: "Good Good Father" })).toBeVisible();
    await expect(main.getByTestId("song-row").filter({ hasText: "What a Beautiful Name" })).toContainText("Hillsong Worship");
  });

  test("search narrows the list and a key opens the song", async ({ page }) => {
    await page.goto("/mobile/songs");
    const main = page.locator("main");
    await expect(main.getByTestId("song-row").filter({ hasText: "Good Good Father" })).toBeVisible({ timeout: 30000 });

    await main.getByRole("textbox", { name: "Search songs" }).fill("Beautiful");
    await expect(main.getByTestId("song-row").filter({ hasText: "Good Good Father" })).toHaveCount(0, { timeout: 15000 });
    const song = main.getByTestId("song-row").filter({ hasText: "What a Beautiful Name" });
    await expect(song).toBeVisible();

    await song.getByRole("button", { name: /^Key of B/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("What a Beautiful Name", { timeout: 15000 });
    await expect(page.getByTestId("song-dialog-close-button")).toBeVisible();
  });

  test("a search with no match says so", async ({ page }) => {
    await page.goto("/mobile/songs");
    const main = page.locator("main");
    await expect(main.getByTestId("song-row").first()).toBeVisible({ timeout: 30000 });
    await main.getByRole("textbox", { name: "Search songs" }).fill("zzqx no such song");
    await expect(main).toContainText("No songs match your search.", { timeout: 15000 });
  });
});

test.describe("Mobile songs when signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("asks the visitor to sign in", async ({ page }) => {
    await page.goto("/mobile/songs");
    await expect(page.getByRole("heading", { name: "Sign in to see the song library" })).toBeVisible({ timeout: 30000 });
  });
});
