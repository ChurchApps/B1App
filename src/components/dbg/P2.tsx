"use client";
import React from "react";
import { registerElementRenderer } from "@churchapps/apphelper/website";
registerElementRenderer("dbgzzz", () => null);
export default function P2() { return <p>p2 ok {typeof React}</p>; }
