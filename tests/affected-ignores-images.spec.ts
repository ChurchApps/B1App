import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pins tests/setup/affected.mjs: screenshots, images and docs never run the full suite; unmapped source does.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const select = (file: string) =>
  execFileSync("node", ["tests/setup/affected.mjs", "--files", file, "--list"], { cwd: root, encoding: "utf8" });

const ALWAYS_ONLY = "no app or spec changes; running the always-on specs only\ntests/mobile-shell.spec.ts\ntests/public-navigation.spec.ts\n";

test.describe("Affected test selector", () => {
  for (const file of [".pr-screenshots/before.png", "src/app/icon.png", "tests/README.md"]) {
    test(`${file} runs only the always-on specs`, () => {
      const out = select(file);
      expect(out).not.toContain("full suite");
      expect(out).not.toContain("(all specs)");
      expect(out).toBe(ALWAYS_ONLY);
    });
  }

  test("an unmapped source file runs the full suite", () => {
    const out = select("src/helpers/not-in-any-area.ts");
    expect(out).toContain("full suite:");
    expect(out).toContain("(all specs)");
  });
});
