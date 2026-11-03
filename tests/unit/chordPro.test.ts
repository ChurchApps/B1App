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

describe("ChordProHelper.formatLyrics", () => {
  it("renders a section marker as a heading", () => {
    assert.equal(ChordProHelper.formatLyrics("[Chorus]", 0), "<h3 style=\"margin-bottom:0px\">Chorus</h3>");
  });

  it("keeps a lyric line that starts and ends with a chord as a line (issue 1449)", () => {
    const html = ChordProHelper.formatLyrics("[D]Waking or [G]sleeping, Thy [D]presence my [A]light.[D]", 0);
    assert.ok(!html.includes("<h3"), html);
    assert.ok(html.startsWith("<div class=\"line\">"), html);
  });
});
