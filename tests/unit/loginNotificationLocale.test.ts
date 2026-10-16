import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

// PR 627: login, the notification banner, unblock instructions, and notification category
// names were hardcoded English. Pin that they read locale keys and that hu matches en.
const root = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const get = (obj: any, key: string) => key.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);

const en = JSON.parse(read("public/locales/en.json"));
const hu = JSON.parse(read("public/locales/hu.json"));

const categoryKeys = ["direct_messages", "event_reminders", "serving_schedule", "tasks", "group_messages", "announcements", "group_activity"];
const loginKeys = ["agreeBefore", "agreeAfter", "foundRecordBefore", "foundRecordAfter", "noAccountForEmail", "register"];
const newKeys = [
  ...Object.keys(en.mobile.notificationBanner).map((k) => "mobile.notificationBanner." + k),
  ...Object.keys(en.mobile.notificationPrefs.categoryNames).map((k) => "mobile.notificationPrefs.categoryNames." + k),
  ...loginKeys.map((k) => "mobile.login." + k)
];

const placeholders = (value: string) => (value.match(/\{\{[^}]*\}\}|\{\}/g) || []).sort();
const words = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").split(/[_\s]+/).filter(Boolean);
const titleCase = (key: string) => words(key).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");

describe("login and notification locale keys", () => {
  it("every new key exists in en and hu with matching placeholders", () => {
    assert.ok(newKeys.length > loginKeys.length + categoryKeys.length);
    for (const key of newKeys) {
      const enValue = get(en, key);
      const huValue = get(hu, key);
      assert.equal(typeof enValue, "string", "en missing " + key);
      assert.equal(typeof huValue, "string", "hu missing " + key);
      assert.deepEqual(placeholders(huValue), placeholders(enValue), "placeholder mismatch " + key);
    }
    assert.deepEqual(Object.keys(hu.mobile.notificationBanner).sort(), Object.keys(en.mobile.notificationBanner).sort());
  });

  it("blockedBody keeps the {} slot for unblock instructions", () => {
    assert.ok(en.mobile.notificationBanner.blockedBody.includes("{}"));
    assert.ok(hu.mobile.notificationBanner.blockedBody.includes("{}"));
  });

  it("categoryNames are exactly the Api NotificationCategoryHelper keys", () => {
    assert.deepEqual(Object.keys(en.mobile.notificationPrefs.categoryNames).sort(), [...categoryKeys].sort());
    assert.deepEqual(Object.keys(hu.mobile.notificationPrefs.categoryNames).sort(), [...categoryKeys].sort());
  });

  it("no English value is just its key name in Title Case", () => {
    // These were the hardcoded button labels before the move to locale keys, so the title-case value is the real text.
    const realLabels: Record<string, string> = { "mobile.login.register": "Register", "mobile.notificationBanner.installApp": "Install App" };
    // categoryNames mirror the Api's English displayName (e.g. direct_messages -> "Direct Messages"), so they are skipped.
    for (const key of newKeys.filter((k) => !k.startsWith("mobile.notificationPrefs.categoryNames."))) {
      if (realLabels[key]) { assert.equal(get(en, key), realLabels[key]); continue; }
      assert.notEqual(get(en, key), titleCase(key.split(".").pop() as string), "placeholder value for " + key);
    }
  });
});

describe("components read the locale keys", () => {
  it("LoginPage uses login keys instead of hardcoded English", () => {
    const src = read("src/app/[sdSlug]/mobile/components/screens/LoginPage.tsx");
    for (const k of loginKeys) assert.ok(src.includes(`Locale.label("mobile.login.${k}")`), "LoginPage missing " + k);
    for (const s of ["By signing in, you agree to our", "We found your record at", "We couldn't find an account with that email", "We couldn&apos;t find an account with that email"]) {
      assert.ok(!src.includes(s), "LoginPage still hardcodes: " + s);
    }
  });

  it("NotificationPermissionBanner uses notificationBanner keys", () => {
    const src = read("src/app/[sdSlug]/mobile/components/NotificationPermissionBanner.tsx");
    assert.ok(src.includes(`Locale.label("mobile.notificationBanner.blockedBody").replace("{}", `));
    for (const k of ["blockedTitle", "enableTitle", "installTitle", "finishTitle", "registrationIncomplete"]) {
      assert.ok(src.includes(`Locale.label("mobile.notificationBanner.${k}")`), "banner missing " + k);
    }
    assert.ok(!src.includes("Notifications are currently blocked."));
  });

  it("WebPushHelper.getUnblockInstructions returns locale labels", () => {
    const src = read("src/helpers/WebPushHelper.ts");
    const body = src.slice(src.indexOf("const getUnblockInstructions"));
    const fn = body.slice(0, body.indexOf("};"));
    assert.ok(fn.includes(`return Locale.label("mobile.notificationBanner.unblockIos")`));
    assert.ok(fn.includes(`return Locale.label("mobile.notificationBanner.unblockChrome")`));
    assert.ok(!src.includes("Open iPhone Settings"));
  });

  it("NotificationPrefsPage translates category names by key with the server name as fallback", () => {
    const src = read("src/app/[sdSlug]/mobile/components/screens/NotificationPrefsPage.tsx");
    assert.ok(src.includes(`Locale.label("mobile.notificationPrefs.categoryNames." + cat.categoryKey, cat.displayName)`));
  });
});
