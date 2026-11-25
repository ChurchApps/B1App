import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { embedFrameAncestors, isEmbedPath, MAX_EMBED_DOMAINS, parseEmbedDomains } from "../../src/helpers/embed.ts";
import { buildContentSecurityPolicy, FRAME_ANCESTORS } from "../../src/helpers/contentSecurityPolicy.ts";
import { isAllowedWhenPublicSiteHidden } from "../../src/helpers/publicSite.ts";

const SOURCE = /^https:\/\/(\*\.)?[a-z0-9.-]+$/;

const frameAncestors = (csp: string) => {
  const found = csp.split("; ").find((d) => d.startsWith("frame-ancestors "));
  assert.ok(found, "missing frame-ancestors in " + csp);
  return found;
};

describe("parseEmbedDomains", () => {
  it("splits on commas, spaces and newlines", () => {
    assert.deepEqual(parseEmbedDomains("gracechurch.org, give.example.com\nexample.net\texample.co.uk  ,,  another-church.org").hosts, ["gracechurch.org", "give.example.com", "example.net", "example.co.uk", "another-church.org"]);
  });

  it("lowercases and strips the scheme, path, query, port and a leading www.", () => {
    assert.deepEqual(parseEmbedDomains("HTTPS://WWW.GraceChurch.org:8443/give/now?x=1#top").hosts, ["gracechurch.org"]);
    assert.deepEqual(parseEmbedDomains("http://example.com/ www.example.net:443 example.org/path").hosts, ["example.com", "example.net", "example.org"]);
    // Only a leading "www." goes: the label can still be part of a name.
    assert.deepEqual(parseEmbedDomains("wwwchurch.org www.www.example.com").hosts, ["wwwchurch.org", "www.example.com"]);
  });

  it("de-duplicates after normalizing", () => {
    const result = parseEmbedDomains("example.com https://www.example.com/ EXAMPLE.COM:443 example.com");
    assert.deepEqual(result.hosts, ["example.com"]);
    assert.deepEqual(result.rejected, []);
  });

  it("accepts punycode and hyphens inside a label", () => {
    assert.deepEqual(parseEmbedDomains("xn--mnchen-3ya.de my-church.xn--p1ai a1.b2.example.io").hosts, ["xn--mnchen-3ya.de", "my-church.xn--p1ai", "a1.b2.example.io"]);
  });

  it("rejects anything that is not a plain hostname", () => {
    const bad = [
      "localhost",
      "com",
      "*",
      "*.example.com",
      "https://*",
      "'self'",
      "'none'",
      "'unsafe-inline'",
      "https:",
      "data:",
      "blob:",
      "-example.com",
      "example-.com",
      "exa_mple.com",
      "example..com",
      ".example.com",
      "example.com.",
      "example.c",
      "example.123",
      "1.2.3.4",
      "[::1]",
      "user@example.com",
      "user:pass@example.com",
      "exa'mple.com",
      "exa\"mple.com",
      "example.com;script-src",
      "münchen.de",
      "example.com\\evil",
      "example.com%0aevil.com",
      "javascript:alert(1)",
      "//example.com",
      "a".repeat(64) + ".com"
    ];
    for (const entry of bad) {
      const result = parseEmbedDomains(entry);
      assert.deepEqual(result.hosts, [], entry);
      assert.equal(result.rejected.length, 1, entry);
    }
  });

  it("reports rejected entries without dropping the good ones", () => {
    const result = parseEmbedDomains("example.com, not a domain, 1.2.3.4");
    assert.deepEqual(result.hosts, ["example.com"]);
    assert.deepEqual(result.rejected, ["not", "a", "domain", "1.2.3.4"]);
  });

  it("caps the hostname length", () => {
    const label = "a".repeat(40);
    assert.deepEqual(parseEmbedDomains(label + "." + label + ".org").hosts.length, 1);
    assert.deepEqual(parseEmbedDomains(label + "." + label + "." + label + ".org").hosts, []);
  });

  it("keeps the first " + MAX_EMBED_DOMAINS + " hosts and reports the rest", () => {
    const names = Array.from({ length: 13 }, (_, i) => "church" + i + ".org");
    const result = parseEmbedDomains(names.join("\n"));
    assert.deepEqual(result.hosts, names.slice(0, MAX_EMBED_DOMAINS));
    assert.deepEqual(result.overLimit, names.slice(MAX_EMBED_DOMAINS));
  });

  it("returns nothing for a missing or non-string setting", () => {
    for (const raw of [
      undefined, null, "", "   ", 42, true, {}, ["example.com"]
    ]) {
      assert.deepEqual(parseEmbedDomains(raw), { hosts: [], rejected: [], overLimit: [] });
    }
  });

  it("stops reading a huge setting", () => {
    const raw = Array.from({ length: 5000 }, (_, i) => "bad_" + i).join(" ") + " example.com";
    const result = parseEmbedDomains(raw);
    assert.deepEqual(result.hosts, []);
    assert.ok(result.rejected.length <= 50);
    assert.deepEqual(parseEmbedDomains("x".repeat(200000) + ".com example.com").hosts, ["example.com"]);
  });
});

describe("embedFrameAncestors", () => {
  it("emits the host and its subdomains over https, and nothing else", () => {
    assert.deepEqual(embedFrameAncestors("www.gracechurch.org, give.example.com"), ["https://gracechurch.org", "https://*.gracechurch.org", "https://give.example.com", "https://*.give.example.com"]);
    assert.deepEqual(embedFrameAncestors(""), []);
    assert.deepEqual(embedFrameAncestors(undefined), []);
  });

  it("never lets the setting add a directive, a keyword or a wildcard to the header", () => {
    const hostile = [
      "example.com; script-src 'unsafe-inline' *",
      "example.com;script-src *",
      "* 'self' 'unsafe-inline' https: http: data:",
      "https://*.com *.org https://*",
      "evil.com\r\nSet-Cookie: a=b",
      "evil.com\nX-Injected: 1",
      "good.org,\u2028evil.com;\u0000",
      "http://insecure.example.com"
    ].join(" , ");
    const sources = embedFrameAncestors(hostile);
    for (const source of sources) assert.match(source, SOURCE, source);
    // "example.com;" is not a hostname, so that entry is dropped whole rather than trimmed into one.
    assert.deepEqual(sources, ["https://evil.com", "https://*.evil.com", "https://good.org", "https://*.good.org", "https://insecure.example.com", "https://*.insecure.example.com"]);
    const header = buildContentSecurityPolicy({ nonce: "n", frameAncestors: sources });
    assert.equal(/[\r\n\u2028\u0000]/.test(header), false);
    assert.equal(header.split("; ").filter((d) => d.startsWith("script-src")).length, 1);
    assert.equal(header.includes("unsafe-inline' *"), false);
    assert.equal(header.includes("X-Injected"), false);
  });

  it("emits at most two sources per allowed host", () => {
    const many = Array.from({ length: 40 }, (_, i) => "church" + i + ".org").join(",");
    assert.equal(embedFrameAncestors(many).length, MAX_EMBED_DOMAINS * 2);
  });
});

describe("buildContentSecurityPolicy frameAncestors option", () => {
  it("leaves the policy unchanged when no extra ancestors are given", () => {
    const base = buildContentSecurityPolicy({ nonce: "n" });
    assert.equal(buildContentSecurityPolicy({ nonce: "n", frameAncestors: [] }), base);
    assert.equal(frameAncestors(base), "frame-ancestors " + FRAME_ANCESTORS.join(" "));
  });

  it("appends the extra ancestors after the ChurchApps embedders and changes no other directive", () => {
    const base = buildContentSecurityPolicy({ nonce: "n" });
    const extra = embedFrameAncestors("gracechurch.org");
    const csp = buildContentSecurityPolicy({ nonce: "n", frameAncestors: extra });
    assert.equal(frameAncestors(csp), "frame-ancestors " + FRAME_ANCESTORS.join(" ") + " https://gracechurch.org https://*.gracechurch.org");
    const others = (value: string) => value.split("; ").filter((d) => !d.startsWith("frame-ancestors "));
    assert.deepEqual(others(csp), others(base));
  });

  it("drops anything that is not an https host source, whatever the caller passes", () => {
    const csp = buildContentSecurityPolicy({
      nonce: "n",
      frameAncestors: [
        "https://ok.example.com",
        "https://*.ok.example.com",
        "*",
        "https:",
        "http://plain.example.com",
        "'unsafe-inline'",
        "https://*",
        "https://a.com; script-src *",
        "https://a.com https://b.com",
        "https://a.com\nX: y",
        "https://*.*.a.com",
        "https://a.com/path",
        "https://a.com:8443",
        ""
      ]
    });
    assert.equal(frameAncestors(csp), "frame-ancestors " + FRAME_ANCESTORS.join(" ") + " https://ok.example.com https://*.ok.example.com");
  });
});

describe("isEmbedPath", () => {
  it("matches the embed routes exactly", () => {
    for (const path of ["/embed/donate", "/embed/donate/", "/embed/forms/FRM00000004", "/embed/forms/FRM00000004/", "/embed/calendar/CAL00000001"]) {
      assert.equal(isEmbedPath(path), true, path);
    }
  });

  it("leaves every other path on the default frame policy", () => {
    const others = [
      "/",
      "/donate",
      "/forms/FRM00000004",
      "/embed",
      "/embed/",
      "/embed/login",
      "/embed/anything",
      "/embed/donate/extra",
      "/embed/forms",
      "/embed/forms/",
      "/embed/forms/a/b",
      "/embed/calendar",
      "/embed/mobile/dashboard",
      "/mobile/embed/donate",
      "/grace/embed/donate",
      "/embedded/donate",
      "/Embed/donate",
      "/login",
      "/mobile/donate"
    ];
    for (const path of others) assert.equal(isEmbedPath(path), false, path);
  });
});

describe("isAllowedWhenPublicSiteHidden", () => {
  it("keeps the embed routes reachable on a hidden public site", () => {
    for (const path of ["/embed/donate", "/embed/forms/FRM00000004", "/embed/calendar/CAL00000001"]) {
      assert.equal(isAllowedWhenPublicSiteHidden(path), true, path);
    }
  });

  it("still gates the public pages", () => {
    for (const path of ["/", "/donate", "/forms/FRM00000004", "/embed", "/embedded", "/sermons"]) {
      assert.equal(isAllowedWhenPublicSiteHidden(path), false, path);
    }
  });
});
