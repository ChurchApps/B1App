import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeCustomCss } from "../../src/helpers/customContentSecurity.ts";

describe("sanitizeCustomCss", () => {
  it("keeps ordinary theme rules", () => {
    const css = `--accent: #112233; h1 { color: #445566; font-size: 2rem; } .hero { background: url(https://content.churchapps.org/x.jpg); }`;
    assert.equal(sanitizeCustomCss(css), css);
  });

  it("strips style breakout, expression, binding, javascript urls, non-https imports, and HTML", () => {
    const dirty = `color: red; </style><script>alert(1)</script> expression(alert(1)) -moz-binding: url(#x); background: url(javascript:alert(1)); @import url('http://evil.test/x.css'); @import url('//evil.test/x.css'); @import url('https://fonts.googleapis.com/css?family=Roboto'); <img src=x onerror=alert(1)>`;
    const clean = sanitizeCustomCss(dirty);
    assert.equal(clean.includes("</style"), false);
    assert.equal(clean.includes("<script"), false);
    assert.equal(clean.includes("<img"), false);
    assert.equal(/expression\s*\(/i.test(clean), false);
    assert.equal(clean.includes("-moz-binding"), false);
    assert.equal(/url\s*\(\s*javascript/i.test(clean), false);
    assert.equal(clean.includes("http://evil.test"), false);
    assert.equal(clean.includes("//evil.test"), false);
    assert.equal(clean.includes("https://fonts.googleapis.com/css?family=Roboto"), true);
    assert.equal(clean.includes("color: red;"), true);
  });

  it("strips payloads that would reassemble after a single pass", () => {
    const clean = sanitizeCustomCss(`width: expexpression(ression(alert(1)); background: <scr<script>ipt>x; -moz--moz-bindingbinding: url(#x);`);
    assert.equal(/expression\s*\(/i.test(clean), false);
    assert.equal(/<script/i.test(clean), false);
    assert.equal(clean.includes("-moz-binding"), false);
  });

  it("drops @import from hosts CSP style-src does not allow", () => {
    const clean = sanitizeCustomCss(`@import url('https://evil.test/x.css'); @import url('https://fonts.googleapis.com.evil.test/x.css'); @import url('https://user:pass@fonts.googleapis.com/x.css'); color: red;`);
    assert.equal(clean.includes("evil.test"), false);
    assert.equal(clean.includes("user:pass"), false);
    assert.equal(clean.includes("color: red;"), true);
  });

  it("strips IE behavior bindings", () => {
    assert.equal(/behavior\s*:/i.test(sanitizeCustomCss(`behavior: url(evil.htc); color: red;`)), false);
  });
});
