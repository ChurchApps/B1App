"use client";

import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { accent as deriveAccent, isValidHex, shade, tint } from "@/helpers/colorTints";
import { gtagLoaderSrc, parseCustomJs, sanitizeCustomCss } from "@/helpers/customContentSecurity";
import React from "react";

interface Props { config: ConfigurationInterface }

const RADIUS_DEFAULTS = { sm: "4px", md: "8px", lg: "12px", xl: "16px" };
const SHADOW_DEFAULTS = {
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 2px 4px rgba(0,0,0,0.1)",
  lg: "0 4px 8px rgba(0,0,0,0.15)"
};

const pushKV = (lines: string[], key: string, value: string | undefined) => {
  if (value !== undefined && value !== null && value !== "") lines.push(`${key}: ${value};`);
};

export const Theme: React.FC<Props> = (props) => {

  const googleFonts: string[] = [];
  const lines: string[] = [];

  let paletteExtras: Record<string, any> = {};
  if (props.config.globalStyles?.palette) {
    const palette = JSON.parse(props.config.globalStyles?.palette);
    pushKV(lines, "--light", palette.light);
    pushKV(lines, "--lightAccent", palette.lightAccent);
    pushKV(lines, "--accent", palette.accent);
    pushKV(lines, "--darkAccent", palette.darkAccent);
    pushKV(lines, "--dark", palette.dark);
    paletteExtras = palette;
  }

  if (props.config.globalStyles?.fonts) {
    const fonts = JSON.parse(props.config.globalStyles?.fonts);
    pushKV(lines, "--headingFont", `'${fonts.heading}'`);
    pushKV(lines, "--bodyFont", `'${fonts.body}'`);
    if (fonts.heading && fonts.heading !== "Roboto") googleFonts.push(fonts.heading);
    if (fonts.body && fonts.body !== "Roboto" && fonts.body !== fonts.heading) googleFonts.push(fonts.body);
  }

  if (props.config.appTheme?.light) {
    const at = props.config.appTheme.light;
    pushKV(lines, "--app-primary", at.primary);
    pushKV(lines, "--app-primary-contrast", at.primaryContrast);
    pushKV(lines, "--app-secondary", at.secondary);
    pushKV(lines, "--app-background", at.background);
    pushKV(lines, "--app-surface", at.surface);
    pushKV(lines, "--app-text", at.textColor);

    if (isValidHex(at.primary)) {
      pushKV(lines, "--app-primary-light", paletteExtras.primaryLight || tint(at.primary, 0.85));
      pushKV(lines, "--app-primary-dark", paletteExtras.primaryDark || shade(at.primary, 0.2));
      pushKV(lines, "--app-accent", paletteExtras.accent || at.secondary || deriveAccent(at.primary));
    }
  }

  const radius = { ...RADIUS_DEFAULTS, ...(paletteExtras.radius || {}) };
  pushKV(lines, "--app-radius-sm", radius.sm);
  pushKV(lines, "--app-radius-md", radius.md);
  pushKV(lines, "--app-radius-lg", radius.lg);
  pushKV(lines, "--app-radius-xl", radius.xl);

  const shadow = { ...SHADOW_DEFAULTS, ...(paletteExtras.shadow || {}) };
  pushKV(lines, "--app-shadow-sm", shadow.sm);
  pushKV(lines, "--app-shadow-md", shadow.md);
  pushKV(lines, "--app-shadow-lg", shadow.lg);

  pushKV(lines, "--app-type-scale", String(paletteExtras.typeScale || 1));

  // Scoped nav rules avoid clobbering auto-derived link color cascade.
  const navRules: string[] = [];
  if (props.config.globalStyles?.navStyles) {
    try {
      const navStyles = JSON.parse(props.config.globalStyles.navStyles);
      const solid = navStyles?.solid;
      if (solid) {
        pushKV(lines, "--nav-bg-color", solid.backgroundColor);
        pushKV(lines, "--nav-link-color", solid.linkColor);
        pushKV(lines, "--nav-link-hover-color", solid.linkHoverColor);
        pushKV(lines, "--nav-active-color", solid.activeColor);
        if (solid.linkColor) navRules.push(`#navbar:not(.transparent) a { color: ${solid.linkColor}; }`);
        if (solid.linkHoverColor) navRules.push(`#navbar:not(.transparent) a:hover { color: ${solid.linkHoverColor}; }`);
        if (solid.activeColor) navRules.push(`#navbar:not(.transparent) .active { border-bottom-color: ${solid.activeColor}; }`);
      }
      const transparent = navStyles?.transparent;
      if (transparent) {
        if (transparent.linkColor) navRules.push(`#navbar.transparent a, #navbar.transparent .nav-link { color: ${transparent.linkColor}; }`);
        if (transparent.linkHoverColor) navRules.push(`#navbar.transparent a:hover, #navbar.transparent .nav-link:hover { color: ${transparent.linkHoverColor}; }`);
        if (transparent.activeColor) navRules.push(`#navbar.transparent .active { border-bottom-color: ${transparent.activeColor}; }`);
      }
    } catch { /* malformed JSON */ }
  }

  const customCss = sanitizeCustomCss(props.config.globalStyles?.customCss || "");
  if (customCss) lines.push(customCss);

  const css = ":root { " + lines.join("\n") + " } " + navRules.join("\n");

  // Rendered as a hoisted <link> below so fonts ship in the initial HTML (no FOUT/CLS).
  let googleFontsUrl = "";
  if (googleFonts.length > 0) {
    const fontList: string[] = [];
    googleFonts.forEach(f => fontList.push(f.replace(/ /g, "+") + ":wght@400;700"));
    googleFontsUrl = "https://fonts.googleapis.com/css2?family=" + fontList.join("&family=") + "&display=swap";
  }

  const customJsRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const root = customJsRef.current;
    if (!root) return;
    root.replaceChildren();
    const customJS = props?.config?.globalStyles?.customJS;
    if (!customJS) return;
    const { externalScripts, measurementIds } = parseCustomJs(customJS);
    const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    if (typeof w.gtag !== "function") w.gtag = function gtag() { w.dataLayer!.push(arguments); };
    for (const item of externalScripts) {
      const script = document.createElement("script");
      script.src = item.src;
      if (item.async) script.async = true;
      if (item.defer) script.defer = true;
      root.appendChild(script);
    }
    for (const id of measurementIds) {
      const src = gtagLoaderSrc(id);
      if (src && !document.querySelector(`script[src="${src}"]`) && !externalScripts.some((s) => s.src === src || s.src.startsWith(src))) {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        root.appendChild(script);
      }
      if (id.startsWith("G-")) {
        w.gtag("js", new Date());
        w.gtag("config", id);
      }
    }
  }, [props?.config?.globalStyles?.customJS]);

  return (<>
    <style jsx global>
      {css}
    </style>
    {googleFontsUrl && <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={googleFontsUrl} precedence="default" />
    </>}
    <div ref={customJsRef} />
  </>);
};
