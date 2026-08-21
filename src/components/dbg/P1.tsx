"use client";
import React from "react";
import { Locale } from "@churchapps/apphelper";
import { Element as AppHelperElement, ElementBlock, registerElementRenderer, setImageOptimizer } from "@churchapps/apphelper/website";
import { LiveStream } from "../video/LiveStream";
import { FormElement } from "../elements/FormElement";
import { b1ImageOptimizer } from "@/helpers/imageOptimizer";
export default function P1() { return <p>p1 ok {[typeof Locale, typeof AppHelperElement, typeof ElementBlock, typeof registerElementRenderer, typeof setImageOptimizer, typeof LiveStream, typeof FormElement, typeof b1ImageOptimizer, typeof React].join(",")}</p>; }
