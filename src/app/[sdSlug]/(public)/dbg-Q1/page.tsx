export const dynamic = "force-dynamic";
const tryReq = (name: string, fn: () => unknown) => { try { const m = fn(); return name + ": ok " + typeof m; } catch (e: any) { return name + ": ERR " + String(e?.stack || e).slice(0, 2000); } };
export default async function Page() {
  const results = [
    tryReq("jsdom", () => require("jsdom")),
    tryReq("jsdom-new", () => { const { JSDOM } = require("jsdom"); return new JSDOM("<!DOCTYPE html>").window.document.title; }),
    tryReq("isomorphic-dompurify", () => require("isomorphic-dompurify")),
    tryReq("node", () => process.version + " " + process.platform + " cwd=" + process.cwd())
  ];
  return <div>{results.map((r, i) => <pre key={i} style={{ whiteSpace: "pre-wrap" }}>{r}</pre>)}<p>q1 ok</p></div>;
}
