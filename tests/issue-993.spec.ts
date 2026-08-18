import { test, expect } from "@playwright/test";

// Issue #993: in the group calendar's New Event modal, the markdown editor's
// link popup ("Url / Appearance / Open in new window / Save") sits at
// z-index 1301, but the Appearance <Select>'s portaled dropdown renders at
// MUI's default modal z-index of 1300 - so the options paint *behind* the
// popup that contains them and can't be clicked.
test.describe("Issue 993 - link editor Appearance dropdown", () => {
  const GROUP_ID = "GRP00000023";

  // Once a Select menu has opened, MUI leaves aria-hidden="true" on the popup
  // (a body-level sibling of the portaled menu) and never clears it, so
  // getByRole goes blind there. Query the role attribute via CSS instead.
  test("Appearance options render above the floating link editor", async ({ page }) => {
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    await expect(page.getByRole("tab", { name: /Events/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole("tab", { name: /Events/i }).click();

    const addBtn = page.getByRole("button", { name: /^Add Event$/i });
    await addBtn.waitFor({ state: "visible", timeout: 15000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/^New Event$/i)).toBeVisible();

    // Type a description and select it, so "Insert Link" has a range to wrap.
    const editorInput = dialog.locator(".editor-input");
    await editorInput.click();
    await editorInput.pressSequentially("Register here");
    await page.keyboard.press("ControlOrMeta+a");
    await dialog.getByRole("button", { name: "Insert Link" }).click();

    // The popup is portaled to document.body and parked off-screen until the
    // selection rect positions it, so wait for it to actually be on screen.
    const linkEditor = page.locator(".link-editor");
    await expect(linkEditor).toBeInViewport({ timeout: 10000 });

    // MUI mirrors the Select's value onto a native input; that survives the
    // aria-hidden quirk above and is the real state the Save button reads.
    const selectedAppearance = linkEditor.locator("input[name='classNames']").first();
    await expect(selectedAppearance).toHaveValue("link");

    await linkEditor.locator('[role="combobox"]').first().click();
    const fullWidth = page.getByRole("option", { name: "Full Width Button" });
    await expect(fullWidth).toBeVisible({ timeout: 10000 });

    // The bug is a stacking-order collision, which `toBeVisible` can't see:
    // hit-test the option's centre and confirm the dropdown - not the link
    // popup painted on top of it - is what the user would actually click.
    expect(await topmostAt(fullWidth)).toBe("option");

    await fullWidth.click();
    await expect(selectedAppearance).toHaveValue("btn btn-block");

    // Choosing a button appearance reveals Variant and Size, whose dropdowns
    // are portaled the same way and regressed identically.
    const variantCombobox = linkEditor.locator('[role="combobox"]').nth(1);
    await variantCombobox.click();
    const accent = page.getByRole("option", { name: "Accent", exact: true });
    await expect(accent).toBeVisible({ timeout: 10000 });
    expect(await topmostAt(accent)).toBe("option");
  });
});

// Reports what the user would actually hit at the centre of `option`:
// "option" when the dropdown is on top, "link-editor" when the popup covers it.
async function topmostAt(option: import("@playwright/test").Locator) {
  return option.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (!hit) return "nothing";
    if (hit === el || el.contains(hit)) return "option";
    if (hit.closest(".link-editor")) return "link-editor";
    return hit.tagName.toLowerCase();
  });
}
