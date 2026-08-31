import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildContentSecurityPolicy, generateNonce, STYLE_SRC_HOSTS } from "../../src/helpers/contentSecurityPolicy.ts";
import { ALLOWED_STYLE_IMPORT_HOSTS } from "../../src/helpers/customContentSecurity.ts";

const directive = (csp: string, name: string): string => {
  const found = csp.split("; ").find((d) => d === name || d.startsWith(name + " "));
  assert.ok(found, `missing ${name} in ${csp}`);
  return found;
};

describe("buildContentSecurityPolicy", () => {
  it("uses a nonce instead of 'unsafe-inline' for scripts", () => {
    const csp = buildContentSecurityPolicy({ nonce: "abc123==" });
    const scriptSrc = directive(csp, "script-src");
    assert.ok(scriptSrc.includes("'nonce-abc123=='"));
    assert.ok(scriptSrc.includes("'strict-dynamic'"));
    assert.equal(scriptSrc.includes("'unsafe-inline'"), false);
    assert.equal(scriptSrc.includes("'unsafe-eval'"), false);
  });

  it("never emits 'unsafe-inline' or 'unsafe-eval' for scripts, even without a nonce", () => {
    const scriptSrc = directive(buildContentSecurityPolicy(), "script-src");
    assert.equal(scriptSrc, "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://www.google.com https://www.gstatic.com https://lotusconsulting.transactiongateway.com");
  });

  it("relaxes only dev-server needs when dev is set", () => {
    const dev = buildContentSecurityPolicy({ nonce: "n", dev: true });
    assert.ok(directive(dev, "script-src").includes("'unsafe-eval'"));
    assert.equal(directive(dev, "script-src").includes("'unsafe-inline'"), false);
    assert.ok(directive(dev, "connect-src").includes("http://localhost:*"));
    assert.ok(directive(dev, "connect-src").includes("ws://localhost:*"));
    assert.equal(directive(buildContentSecurityPolicy({ nonce: "n" }), "connect-src").includes("localhost"), false);
  });

  it("keeps the locked-down base directives", () => {
    const csp = buildContentSecurityPolicy({ nonce: "n" });
    assert.equal(directive(csp, "default-src"), "default-src 'self'");
    assert.equal(directive(csp, "base-uri"), "base-uri 'self'");
    assert.equal(directive(csp, "object-src"), "object-src 'none'");
    assert.equal(directive(csp, "worker-src"), "worker-src 'self' blob:");
    assert.ok(directive(csp, "form-action").startsWith("form-action 'self'"));
  });

  it("allows the Lessons/B1 embedders as frame-ancestors", () => {
    const frameAncestors = directive(buildContentSecurityPolicy(), "frame-ancestors");
    for (const host of ["'self'", "https://b1.church", "https://*.b1.church", "https://lessons.church", "https://*.lessons.church"]) {
      assert.ok(frameAncestors.includes(host), `frame-ancestors missing ${host}`);
    }
  });

  it("allows GA/GTM and payment scripts but no other third-party widgets", () => {
    const scriptSrc = directive(buildContentSecurityPolicy({ nonce: "n" }), "script-src");
    assert.ok(scriptSrc.includes("https://www.googletagmanager.com"));
    assert.ok(scriptSrc.includes("https://www.google-analytics.com"));
    assert.ok(scriptSrc.includes("https://js.stripe.com"));
    // Meta Pixel / Crisp / Intercom stay blocked; re-enabling them is a deliberate decision, not a drive-by edit.
    for (const host of ["facebook", "crisp", "intercom", "hotjar", "tawk"]) {
      assert.equal(scriptSrc.includes(host), false, `script-src should not allow ${host}`);
    }
  });

  it("allows Google Maps geocode and JS hosts on connect-src", () => {
    const connectSrc = directive(buildContentSecurityPolicy({ nonce: "n" }), "connect-src");
    assert.ok(connectSrc.includes("https://maps.googleapis.com"));
    assert.ok(connectSrc.includes("https://maps.gstatic.com"));
  });

  it("keeps style-src inline (React style attributes) and matches the CSS @import allowlist", () => {
    const styleSrc = directive(buildContentSecurityPolicy({ nonce: "n" }), "style-src");
    assert.ok(styleSrc.includes("'unsafe-inline'"));
    for (const host of ALLOWED_STYLE_IMPORT_HOSTS) {
      assert.ok(STYLE_SRC_HOSTS.some((origin) => new URL(origin).hostname === host), `style-src must cover @import host ${host}`);
      assert.ok(styleSrc.includes(host));
    }
  });
});

describe("generateNonce", () => {
  it("returns unique base64 values", () => {
    const values = new Set(Array.from({ length: 50 }, () => generateNonce()));
    assert.equal(values.size, 50);
    for (const value of values) {
      assert.match(value, /^[A-Za-z0-9+/]+={0,2}$/);
      assert.equal(atob(value).length, 16);
    }
  });
});
