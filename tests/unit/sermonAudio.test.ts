import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sermonAudioUrl, sermonDownloadHref, sermonHasVideo } from "../../src/app/[sdSlug]/mobile/components/sermonAudio.ts";

// ChurchAppsSupport#1625: the mobile sermon screen plays and downloads a sermon's podcast audio.
describe("sermonAudioUrl", () => {
  it("accepts http(s) audio and rejects anything else", () => {
    assert.equal(sermonAudioUrl({ audioUrl: "https://cdn.example.com/ep1.mp3" } as any), "https://cdn.example.com/ep1.mp3");
    assert.equal(sermonAudioUrl({ audioUrl: "" } as any), null);
    assert.equal(sermonAudioUrl({ audioUrl: "javascript:alert(1)" } as any), null);
    assert.equal(sermonAudioUrl({} as any), null);
    assert.equal(sermonAudioUrl(null), null);
  });
});

describe("sermonHasVideo", () => {
  it("is true for a YouTube sermon and false for an audio-only one", () => {
    assert.equal(sermonHasVideo({ videoType: "youtube", videoData: "abc123" } as any), true);
    assert.equal(sermonHasVideo({ audioUrl: "https://cdn.example.com/ep1.mp3" } as any), false);
  });
});

describe("sermonDownloadHref", () => {
  it("points the podcast download route at the church feed with the sermon id as guid", () => {
    assert.equal(
      sermonDownloadHref("https://api.churchapps.org/content", "CHU00000001", "SER00000001"),
      "/api/podcast/download?url=https%3A%2F%2Fapi.churchapps.org%2Fcontent%2Fsermons%2Frss%2FCHU00000001&guid=SER00000001"
    );
  });
});
