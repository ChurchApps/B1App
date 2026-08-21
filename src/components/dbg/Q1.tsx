"use client";
import React from "react";
const tryReq = (name: string, fn: () => unknown) => { try { const m = fn(); return name + ": ok " + typeof m; } catch (e: any) { return name + ": ERR " + String(e?.stack || e).slice(0, 1500); } };
const results = [
  tryReq("isomorphic-dompurify", () => require("isomorphic-dompurify")),
  tryReq("jsdom", () => require("jsdom")),
  tryReq("apphelper/markdown", () => require("@churchapps/apphelper/markdown")),
  tryReq("apphelper/website", () => require("@churchapps/apphelper/website")),
  tryReq("apphelper/forms", () => require("@churchapps/apphelper/forms"))
];
export default function Q1() { return <div>{results.map((r, i) => <pre key={i} style={{ whiteSpace: "pre-wrap" }}>{r}</pre>)}<p>q1 ok {typeof React}</p></div>; }
