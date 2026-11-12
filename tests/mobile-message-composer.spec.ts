import { test, expect, devices, type Locator, type Page } from "@playwright/test";

// Adult Bible Class: demo@b1.church is a member, and its group chat is open to members.
const GROUP_ID = "GRP00000004";

const { defaultBrowserType: _browser, ...iPhone } = devices["iPhone 13"];

// The composer's textarea holds the draft as text, so bubble lookups skip it.
const bubbleText = (scope: Locator, text: string) => scope.getByText(text).and(scope.page().locator(":not(textarea)"));

const openGroupChat = async (page: Page) => {
  await page.goto(`/mobile/groups/${GROUP_ID}`);
  await page.getByTestId("group-open-chat").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 15000 });
  const composer = dialog.getByPlaceholder(/Send a message/i);
  await expect(composer).toBeVisible({ timeout: 15000 });
  return { dialog, composer };
};

const openFirstConversation = async (page: Page) => {
  await page.goto("/mobile/messages");
  const row = page.locator('[data-testid^="conversation-row-"]').first();
  await expect(row).toBeVisible({ timeout: 30000 });
  await row.click();
  const composer = page.getByPlaceholder(/Type a message/i);
  await expect(composer).toBeVisible({ timeout: 15000 });
  return composer;
};

test.describe("Message composer on a phone", () => {
  test.use(iPhone);

  test("the device reports a touch pointer", async ({ page }) => {
    await page.goto("/mobile/messages");
    expect(await page.evaluate(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches)).toBe(false);
  });

  test("Enter starts a new line in group chat and Send posts one message with its time", async ({ page }) => {
    const { dialog, composer } = await openGroupChat(page);
    const stamp = Date.now();
    await composer.click();
    await composer.pressSequentially(`line one ${stamp}`);
    await composer.press("Enter");
    await composer.pressSequentially(`line two ${stamp}`);
    await expect(composer).toHaveValue(`line one ${stamp}\nline two ${stamp}`);
    await expect(bubbleText(dialog, `line one ${stamp}`)).toHaveCount(0);

    await dialog.getByRole("button", { name: /^Send$/i }).click();
    await expect(composer).toHaveValue("", { timeout: 15000 });
    const bubble = bubbleText(dialog, `line one ${stamp}`);
    await expect(bubble).toHaveCount(1, { timeout: 15000 });
    expect(await bubble.innerText()).toBe(`line one ${stamp}\nline two ${stamp}`);
    await expect(dialog.getByTestId("message-time").last()).toHaveText(/^(now|\d{1,2}:\d{2}.*)$/i);
  });

  test("Enter starts a new line in a direct message and each bubble shows when it was sent", async ({ page }) => {
    const composer = await openFirstConversation(page);
    const stamp = Date.now();
    await composer.click();
    await composer.pressSequentially(`dm one ${stamp}`);
    await composer.press("Enter");
    await composer.pressSequentially(`dm two ${stamp}`);
    await expect(composer).toHaveValue(`dm one ${stamp}\ndm two ${stamp}`);

    await page.getByRole("button", { name: /^Send$/i }).click();
    await expect(composer).toHaveValue("", { timeout: 15000 });
    const bubble = bubbleText(page.locator("main"), `dm one ${stamp}`);
    await expect(bubble).toHaveCount(1, { timeout: 15000 });
    expect(await bubble.innerText()).toBe(`dm one ${stamp}\ndm two ${stamp}`);

    const times = page.getByTestId("message-time");
    await expect(times.last()).toHaveText(/^(now|\d{1,2}:\d{2}.*)$/i);
    await page.reload();
    await expect(bubbleText(page.locator("main"), `dm one ${stamp}`)).toBeVisible({ timeout: 30000 });
    await expect(times.first()).toHaveText(/\d{1,2}:\d{2}|now/i);
  });
});

test.describe("Message composer with a keyboard and mouse", () => {
  test("Enter still sends in group chat", async ({ page }) => {
    const { dialog, composer } = await openGroupChat(page);
    const text = `desktop enter ${Date.now()}`;
    await composer.fill(text);
    await composer.press("Enter");
    await expect(composer).toHaveValue("", { timeout: 15000 });
    await expect(bubbleText(dialog, text)).toHaveCount(1, { timeout: 15000 });
  });
});

// ChurchAppsSupport#1474: chat text renders **bold**, _italic_ and lists, and the composer has a formatting popup.
test.describe("Message formatting on a phone", () => {
  test.use(iPhone);

  test("group chat shows **bold** as bold text without the asterisks", async ({ page }) => {
    const { dialog, composer } = await openGroupChat(page);
    const stamp = Date.now();
    await composer.fill(`**Reminder** for Thursday ${stamp}`);
    await dialog.getByRole("button", { name: /^Send$/i }).click();
    await expect(composer).toHaveValue("", { timeout: 15000 });
    const bubble = bubbleText(dialog, `for Thursday ${stamp}`);
    await expect(bubble).toHaveCount(1, { timeout: 15000 });
    await expect(bubble.locator("strong", { hasText: "Reminder" })).toBeVisible();
    expect(await bubble.innerText()).toBe(`Reminder for Thursday ${stamp}`);
  });

  test("a web link in group chat stays in the sentence as a clickable link", async ({ page }) => {
    const { dialog, composer } = await openGroupChat(page);
    const stamp = Date.now();
    const url = `https://example.com/signup-${stamp}`;
    await composer.fill(`Sign up at ${url} today`);
    await dialog.getByRole("button", { name: /^Send$/i }).click();
    await expect(composer).toHaveValue("", { timeout: 15000 });
    const bubble = dialog.getByTestId("message-text").filter({ hasText: `signup-${stamp}` });
    await expect(bubble).toHaveCount(1, { timeout: 15000 });
    expect(await bubble.innerText()).toBe(`Sign up at ${url} today`);
    await expect(bubble.locator(`a[href="${url}"]`)).toHaveAttribute("target", "_blank");
    await expect(dialog.getByText("Open file")).toHaveCount(0);
  });

  test("a direct message with dashes on each line shows a bulleted list", async ({ page }) => {
    const composer = await openFirstConversation(page);
    const stamp = Date.now();
    await composer.click();
    await composer.pressSequentially(`- milk ${stamp}`);
    await composer.press("Enter");
    await composer.pressSequentially(`- eggs ${stamp}`);
    await page.getByRole("button", { name: /^Send$/i }).click();
    await expect(composer).toHaveValue("", { timeout: 15000 });
    const main = page.locator("main");
    await expect(main.locator("li", { hasText: `eggs ${stamp}` })).toBeVisible({ timeout: 15000 });
    await expect(main.locator("li", { hasText: `milk ${stamp}` })).toBeVisible();
  });

  // ChurchAppsSupport#1545: the format buttons sit in a row under the box while it has focus, so the phone's
  // Copy / Select All callout above a selection never covers them, and no selection is needed first.
  test("focusing the group chat composer shows a formatting row whose Bold button wraps the selection", async ({ page }) => {
    const { composer } = await openGroupChat(page);
    // The dev server's corner badge sits over the row's first button on a phone; it does not exist in production.
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    await composer.fill("Hello world");
    await composer.evaluate((el: HTMLTextAreaElement) => {
      el.focus();
      el.setSelectionRange(11, 11);
    });
    const row = page.getByTestId("formatting-popup");
    for (const name of ["Bold", "Italic", "Bulleted list", "Numbered list"]) await expect(row.getByRole("button", { name, exact: true })).toBeVisible();
    const composerBox = await composer.boundingBox();
    const rowBox = await row.boundingBox();
    expect(rowBox!.y).toBeGreaterThanOrEqual(composerBox!.y + composerBox!.height - 1);
    await row.getByRole("button", { name: "Bulleted list", exact: true }).click();
    await expect(composer).toHaveValue("- Hello world");
    await composer.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(8, 13));
    await row.getByRole("button", { name: "Bold", exact: true }).click();
    await expect(composer).toHaveValue("- Hello **world**");
  });
});

test.describe("Message formatting with a keyboard", () => {
  test("Ctrl+B bolds the highlighted word in the group chat composer", async ({ page }) => {
    const { composer } = await openGroupChat(page);
    await composer.fill("Hello world");
    await composer.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(0, 5));
    await composer.press("Control+b");
    await expect(composer).toHaveValue("**Hello** world");
    await composer.press("Control+i");
    await expect(composer).toHaveValue("**_Hello_** world");
  });
});
