import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchPublicImage, type ImageHop } from "../../src/helpers/podcastDownload.ts";

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0
]);
const publicLookup = async () => [{ address: "1.2.3.4", family: 4 }];
const hop = (overrides: Partial<ImageHop> = {}): ImageHop => ({ status: 200, contentType: "image/png", data: PNG, ...overrides });

describe("fetchPublicImage", () => {
  it("returns a raster image from a public host", async () => {
    const result = await fetchPublicImage("https://content.churchapps.org/favicon.png", { lookup: publicLookup, fetchImage: async () => hop() });
    assert.deepEqual(result, PNG);
  });

  for (const url of ["http://169.254.169.254/latest/meta-data/x.png", "http://127.0.0.1:8084/x.png", "http://localhost/x.png", "http://[::1]/x.png", "file:///etc/passwd", "https://user:pw@example.com/x.png"]) {
    it(`refuses ${url}`, async () => {
      let fetched = false;
      const result = await fetchPublicImage(url, { lookup: publicLookup, fetchImage: async () => { fetched = true; return hop(); } });
      assert.equal(result, null);
      assert.equal(fetched, false);
    });
  }

  it("refuses a hostname that resolves to a private address", async () => {
    let fetched = false;
    const result = await fetchPublicImage("https://icons.example.com/a.png", { lookup: async () => [{ address: "10.0.0.5", family: 4 }], fetchImage: async () => { fetched = true; return hop(); } });
    assert.equal(result, null);
    assert.equal(fetched, false);
  });

  it("does not follow redirects", async () => {
    const result = await fetchPublicImage("https://icons.example.com/a.png", { lookup: publicLookup, fetchImage: async () => hop({ status: 302, data: null }) });
    assert.equal(result, null);
  });

  it("refuses SVG by content type", async () => {
    const result = await fetchPublicImage("https://icons.example.com/a.svg", { lookup: publicLookup, fetchImage: async () => hop({ contentType: "image/svg+xml", data: Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"/>") }) });
    assert.equal(result, null);
  });

  it("refuses SVG or other markup served as a generic type", async () => {
    const result = await fetchPublicImage("https://icons.example.com/a", { lookup: publicLookup, fetchImage: async () => hop({ contentType: "application/octet-stream", data: Buffer.from("  <?xml version=\"1.0\"?><svg/>") }) });
    assert.equal(result, null);
  });

  it("refuses non-image content", async () => {
    const result = await fetchPublicImage("https://icons.example.com/a", { lookup: publicLookup, fetchImage: async () => hop({ contentType: "text/html", data: Buffer.from("<html></html>") }) });
    assert.equal(result, null);
  });

  it("accepts a raster image stored as octet-stream", async () => {
    const result = await fetchPublicImage("https://content.churchapps.org/favicon", { lookup: publicLookup, fetchImage: async () => hop({ contentType: "application/octet-stream" }) });
    assert.deepEqual(result, PNG);
  });
});
