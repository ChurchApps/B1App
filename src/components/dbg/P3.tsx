"use client";
import React from "react";
import { setImageOptimizer } from "@churchapps/apphelper/website";
import { b1ImageOptimizer } from "@/helpers/imageOptimizer";
setImageOptimizer(b1ImageOptimizer);
export default function P3() { return <p>p3 ok {typeof React}</p>; }
