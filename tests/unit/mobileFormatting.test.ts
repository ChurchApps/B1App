import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyFormat, withHardBreaks } from "../../src/app/[sdSlug]/mobile/components/formatting.ts";

// ChurchAppsSupport#1474: Bold / Italic / Bullets / Numbered in the chat composers.
describe("applyFormat", () => {
  it("wraps a selection in ** or _ and keeps it selected", () => {
    assert.deepEqual(applyFormat("Hello world", 6, 11, "bold"), { value: "Hello **world**", start: 8, end: 13 });
    assert.deepEqual(applyFormat("Hello world", 0, 5, "italic"), { value: "_Hello_ world", start: 1, end: 6 });
  });

  it("unwraps a selection that is already bold", () => {
    assert.deepEqual(applyFormat("Hello **world**", 8, 13, "bold"), { value: "Hello world", start: 6, end: 11 });
  });

  it("prefixes touched lines with bullets or numbers, and toggles them off", () => {
    assert.equal(applyFormat("milk\neggs", 0, 9, "bullets").value, "- milk\n- eggs");
    assert.equal(applyFormat("a\nb\nc", 0, 5, "numbered").value, "1. a\n2. b\n3. c");
    assert.equal(applyFormat("- a\n- b", 0, 7, "bullets").value, "a\nb");
  });
});

describe("withHardBreaks", () => {
  it("keeps single line breaks and leaves paragraph breaks alone", () => {
    assert.equal(withHardBreaks("one\ntwo"), "one  \ntwo");
    assert.equal(withHardBreaks("one\n\ntwo"), "one\n\ntwo");
    assert.equal(withHardBreaks("a\r\nb"), "a  \nb");
  });
});
