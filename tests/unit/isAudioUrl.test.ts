import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAudioUrl } from "../../src/app/[sdSlug]/mobile/components/plans/mediaUrl.ts";

describe("isAudioUrl", () => {
  it("returns true for .mp3 and other audio extensions", () => {
    assert.equal(isAudioUrl("https://cdn.example.com/click.mp3"), true);
    assert.equal(isAudioUrl("https://cdn.example.com/demo.m4a"), true);
    assert.equal(isAudioUrl("https://cdn.example.com/track.AAC"), true);
    assert.equal(isAudioUrl("https://cdn.example.com/rehearsal.wav?dl=1"), true);
    assert.equal(isAudioUrl("https://cdn.example.com/mix.flac"), true);
    assert.equal(isAudioUrl("https://cdn.example.com/loop.oga"), true);
  });

  it("does not treat images or video-container .ogg as audio", () => {
    assert.equal(isAudioUrl("https://cdn.example.com/art.jpg"), false);
    assert.equal(isAudioUrl("https://cdn.example.com/still.png"), false);
    assert.equal(isAudioUrl("https://cdn.example.com/clip.ogg"), false);
    assert.equal(isAudioUrl("https://cdn.example.com/movie.mp4"), false);
  });
});
