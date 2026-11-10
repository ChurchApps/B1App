import { test, expect } from "@playwright/test";

// Account-only screens used to render empty lists, endless skeletons or a blank editable profile when signed out.
test.describe("Account screens when signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const screens: { slug: string; heading: string }[] = [
    { slug: "messages", heading: "Sign in to see your messages" },
    { slug: "messages/new", heading: "Sign in to see your messages" },
    { slug: "notifications", heading: "Sign in to see your inbox" },
    { slug: "profileEdit", heading: "Sign in to edit your profile" },
    { slug: "myTasks", heading: "Sign in to see your tasks" }
  ];

  for (const { slug, heading } of screens) {
    test(`/mobile/${slug} asks the visitor to sign in and comes back after`, async ({ page }) => {
      await page.goto(`/mobile/${slug}`);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible({ timeout: 30000 });
      const signIn = page.locator("main").getByRole("link", { name: "Sign In" });
      await expect(signIn).toHaveAttribute("href", `/mobile/login?returnUrl=${encodeURIComponent(`/mobile/${slug}`)}`);
    });
  }
});
