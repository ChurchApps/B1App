import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

// Issue 1143: a locale sync pruned keys that src/ still uses, so pages printed raw
// keys like "mobile.install.desktopTitle". Every static Locale.label("x") key must
// resolve in the app's en.json or the apphelper's en.json.
const root = join(import.meta.dirname, "..", "..");

const walk = (dir: string, out: string[] = []) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
};

const has = (obj: any, key: string) => key.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj) !== undefined;

describe("locale keys", () => {
  it("every static Locale.label key exists in en.json", () => {
    const appEn = JSON.parse(readFileSync(join(root, "public/locales/en.json"), "utf8"));
    const helperEn = JSON.parse(readFileSync(join(root, "public/apphelper/locales/en.json"), "utf8"));
    const keys = new Set<string>();
    for (const file of walk(join(root, "src"))) {
      for (const m of readFileSync(file, "utf8").matchAll(/Locale\.label\(\s*"([^"]+)"\s*[,)]/g)) keys.add(m[1]);
    }
    const missing = [...keys].filter((k) => !has(appEn, k) && !has(helperEn, k)).sort();
    assert.deepEqual(missing, []);
  });
});
