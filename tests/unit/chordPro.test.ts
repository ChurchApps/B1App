import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ChordProHelper } from "../../src/helpers/ChordProHelper.ts";

describe("ChordProHelper.transposeChords", () => {
  it("transposes every chord exactly once", () => {
    assert.equal(ChordProHelper.transposeChords("[C] [D]", 2), "[D] [E]");
    assert.equal(ChordProHelper.transposeChords("[G]Amazing [C]grace [G/B]how [D]sweet", 2), "[A]Amazing [D]grace [A/C#]how [E]sweet");
  });

  it("leaves lines without chords unchanged", () => {
    assert.equal(ChordProHelper.transposeChords("no chords here", 3), "no chords here");
  });
});
