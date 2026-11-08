import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseTitleOptions, DEFAULT_TITLES } from "../../src/helpers/TitleOptions.ts";

describe("parseTitleOptions", () => {
  it("falls back to the default titles when the setting is missing, malformed or empty", () => {
    assert.deepEqual(parseTitleOptions(undefined), DEFAULT_TITLES);
    assert.deepEqual(parseTitleOptions("not json"), DEFAULT_TITLES);
    assert.deepEqual(parseTitleOptions("[]"), DEFAULT_TITLES);
  });

  it("trims, caps at ten characters and drops case-insensitive duplicates", () => {
    assert.deepEqual(parseTitleOptions(JSON.stringify([" Deacon ", "Elder", "elder", "", "Evangelistic", 5])), ["Deacon", "Elder", "Evangelist"]);
  });
});
