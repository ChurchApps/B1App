import { test, expect, openAndLoad } from "./fixtures";

// One read-only visit per main member-app screen. The API path is the signed-in request that
// proves the screen loaded the member's own data, not just the app shell.
const SCREENS: { name: string; path: string; api: RegExp }[] = [
  { name: "Home", path: "/mobile/dashboard", api: /\/content\/events\/timeline$/ },
  { name: "Groups", path: "/mobile/groups", api: /\/membership\/groups\/my$/ },
  // Needs directory access: People View, or a membership status the church's directory setting allows.
  { name: "Community", path: "/mobile/community", api: /\/membership\/people$/ },
  { name: "Messages", path: "/mobile/messages", api: /\/messaging\/privateMessages$/ },
  { name: "Me", path: "/mobile/me", api: /\/doing\/assignments\/my$/ }
];

for (const s of SCREENS) {
  test(`${s.name} loads`, async ({ page }) => {
    await openAndLoad(page, s.path, s.api);
    await expect(page).toHaveURL(new RegExp(s.path));
    await expect(page.getByRole("button", { name: "Profile", exact: true }).filter({ visible: true }).first()).toBeVisible();
  });
}
