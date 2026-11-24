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

  test("the song panel shows the arrangement's sequence above the lyrics and lists chart PDFs under Files", async ({ page }) => {
    // Layer a sequence and an uploaded chart onto the real arrangement so the shared demo data stays untouched.
    await page.route(/\/content\/arrangements\/[^/?]+$/, async (route) => {
      const response = await route.fetch();
      const arrangement = await response.json();
      await route.fulfill({ response, json: { ...arrangement, sequence: "Verse 1, Chorus, Verse 2, Chorus, Bridge" } });
    });
    await page.route(/\/content\/files\/arrangement\/[^/?]+$/, async (route) => {
      await route.fulfill({
        json: [
          { id: "E2EPDF1", contentType: "arrangement", fileName: "beautiful-name-chart.pdf", fileType: "application/pdf", contentPath: "https://content.example.test/chart.pdf" },
          { id: "E2EMP31", contentType: "arrangement", fileName: "beautiful-name.mp3", fileType: "audio/mpeg", contentPath: "https://content.example.test/track.mp3" }
        ]
      });
    });

    await page.goto("/mobile/songs");
    const main = page.locator("main");
    const song = main.getByTestId("song-row").filter({ hasText: "What a Beautiful Name" });
    await expect(song).toBeVisible({ timeout: 30000 });
    await song.getByRole("button", { name: /^Key of B/ }).click();

    const dialog = page.getByRole("dialog");
    const sequence = dialog.getByTestId("song-sequence");
    await expect(sequence).toContainText("Verse 1, Chorus, Verse 2, Chorus, Bridge", { timeout: 15000 });
    const lyricsHeading = dialog.getByRole("heading", { name: "Lyrics" });
    await expect(lyricsHeading).toBeVisible();
    const sequenceBox = await sequence.boundingBox();
    const lyricsBox = await lyricsHeading.boundingBox();
    expect(sequenceBox!.y).toBeLessThan(lyricsBox!.y);

    const chart = dialog.getByTestId("song-chart-0-link");
    await expect(chart).toHaveText("beautiful-name-chart.pdf");
    await expect(chart).toHaveAttribute("href", "https://content.example.test/chart.pdf");
    await expect(chart).toHaveAttribute("target", "_blank");
    await expect(dialog.getByTestId("song-audio-0-audio")).toHaveAttribute("src", "https://content.example.test/track.mp3");
    await expect(dialog.getByTestId("song-audio-1-audio")).toHaveCount(0);
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
