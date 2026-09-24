import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDayOfYear } from "../../src/app/[sdSlug]/mobile/helpers/dailyVerses.ts";

describe("getDayOfYear", () => {
  it("counts calendar days regardless of time of day or DST", () => {
    assert.equal(getDayOfYear(new Date(2026, 0, 1, 0, 30)), 1);
    assert.equal(getDayOfYear(new Date(2026, 2, 9, 0, 30)), 68);
    assert.equal(getDayOfYear(new Date(2026, 11, 31, 23, 59)), 365);
  });
});
