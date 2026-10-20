import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contentDisposition,
  episodeFilename,
  followAudio,
  isPrivateAddress,
  pickEpisode,
  PodcastDownloadError,
  preparePodcastDownload,
  type Hop
} from "../../src/helpers/podcastDownload.ts";

const ANCHOR = "https://anchor.fm/s/1/podcast/play/2/https%3A%2F%2Fd3ctxlq1ktw2nl5.cloudfront.net%2Fa.mp3";
const publicLookup = async () => [{ address: "1.2.3.4", family: 4 }];

const streamOf = (text: string): ReadableStream<Uint8Array> => new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode(text));
    controller.close();
  }
});

const audioHop = (text = "audio"): Hop => ({
  status: 200,
  location: null,
  contentType: "audio/mpeg",
  contentLength: text.length,
  body: streamOf(text)
});

describe("podcast download filename", () => {
  it("names the file from the episode title, not Spotify's address", () => {
    const name = episodeFilename("Walking Through Ruth", "audio/mpeg", ANCHOR);
    assert.equal(name, "Walking Through Ruth.mp3");
    const header = contentDisposition(name);
    assert.match(header, /^attachment;/);
    assert.match(header, /filename="Walking Through Ruth\.mp3"/);
    assert.doesNotMatch(header, /d3ctx|https___/);
  });

  it("keeps a non-English title in filename* and strips header breaks", () => {
    const name = episodeFilename("Lectura del día\r\nSet-Cookie: a", "audio/mpeg", "https://cdn.example.com/a.mp3");
    assert.equal(name.includes("\r") || name.includes("\n"), false);
    const header = contentDisposition(name);
    assert.equal(header.includes("\r") || header.includes("\n"), false);
    assert.match(header, /filename="Lectura del d_a Set-Cookie a\.mp3"/);
    assert.match(header, /filename\*=UTF-8''Lectura%20del%20d%C3%ADa%20Set-Cookie%20a\.mp3/);
  });
});

describe("podcast download safety", () => {
  it("treats loopback, private, link-local and metadata addresses as blocked", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.1.1", "169.254.169.254", "::1", "2002:a9fe:a9fe::"]) {
      assert.equal(isPrivateAddress(ip), true, ip);
    }
    assert.equal(isPrivateAddress("8.8.8.8"), false);
    assert.equal(isPrivateAddress("1.2.3.4"), false);
  });

  it("does not request an enclosure that is not in the feed", async () => {
    let called = false;
    await assert.rejects(
      () => preparePodcastDownload("https://feeds.example.com/podcast.xml", "missing", {
        fetchFeed: async () => ({ status: 200, json: { episodes: [{ guid: "ep-2", title: "Walking Through Ruth", audioUrl: ANCHOR, audioType: "audio/mpeg" }] } }),
        fetchHop: async () => { called = true; return audioHop(); }
      }),
      (err: unknown) => err instanceof PodcastDownloadError && err.status === 404
    );
    assert.equal(called, false);
  });

  it("does not follow a redirect onto a private address", async () => {
    const calls: string[] = [];
    await assert.rejects(
      () => followAudio("https://cdn.example.com/ep.mp3", async (url) => {
        calls.push(url);
        return { status: 302, location: "http://127.0.0.1/secret", contentType: null, contentLength: null, body: null };
      }, publicLookup),
      (err: unknown) => err instanceof PodcastDownloadError && err.status === 400
    );
    assert.deepEqual(calls, ["https://cdn.example.com/ep.mp3"]);
  });

  it("does not fetch a host that resolves to a private address", async () => {
    let called = false;
    await assert.rejects(
      () => followAudio("https://evil.example/a.mp3", async () => { called = true; return audioHop(); }, async () => [{ address: "169.254.169.254" }]),
      (err: unknown) => err instanceof PodcastDownloadError && err.status === 400
    );
    assert.equal(called, false);
  });

  it("rejects an episode that is not audio", async () => {
    await assert.rejects(
      () => followAudio("https://cdn.example.com/a.mp3", async () => ({ status: 200, location: null, contentType: "text/html", contentLength: 5, body: streamOf("nope") }), publicLookup),
      (err: unknown) => err instanceof PodcastDownloadError && err.message === "Episode file is not audio"
    );
  });
});

describe("preparePodcastDownload", () => {
  it("saves the enclosure from the feed under the episode title", async () => {
    const calls: string[] = [];
    const result = await preparePodcastDownload("https://feeds.example.com/podcast.xml", "ep-2", {
      lookup: publicLookup,
      fetchFeed: async () => ({
        status: 200,
        json: { episodes: [{ guid: "ep-2", title: "Walking Through Ruth", audioUrl: ANCHOR, audioType: "audio/mpeg" }] }
      }),
      fetchHop: async (url) => {
        calls.push(url);
        return audioHop("bytes");
      }
    });
    assert.deepEqual(calls, [ANCHOR]);
    assert.equal(result.headers["Content-Type"], "audio/mpeg");
    assert.match(result.headers["Content-Disposition"], /filename="Walking Through Ruth\.mp3"/);
    assert.equal(pickEpisode({ episodes: [{ guid: "x", title: "No file", audioUrl: "" }] }, "x"), null);
  });

  it("requires a feed url and an episode id", async () => {
    await assert.rejects(
      () => preparePodcastDownload("", "ep-2", { fetchFeed: async () => { throw new Error("should not fetch"); } }),
      (err: unknown) => err instanceof PodcastDownloadError && err.status === 400
    );
  });
});
