"use client";

import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { accent as deriveAccent, isValidHex, shade, tint } from "@/helpers/colorTints";
import React from "react";

interface Props { config?:ConfigurationInterface }

// Defaults that all components can rely on. Admins override by adding keys to the
// existing `globalStyles.palette` JSON blob — no DB schema change required.
// `palette` may include: radius {sm,md,lg,xl}, shadow {sm,md,lg}, typeScale,
// primaryLight, primaryDark, accent, voice.
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

    // Derived tints — only emit when the church didn't set them explicitly.
    // Any of these can be overridden via palette JSON.
    if (isValidHex(at.primary)) {
      pushKV(lines, "--app-primary-light", paletteExtras.primaryLight || tint(at.primary, 0.85));
      pushKV(lines, "--app-primary-dark", paletteExtras.primaryDark || shade(at.primary, 0.2));
      pushKV(lines, "--app-accent", paletteExtras.accent || at.secondary || deriveAccent(at.primary));
    }
  }

  // Radius / shadow / type-scale tokens. Defaults render unchanged sites; admins
  // dial the whole site by setting palette.radius.* / palette.shadow.* / palette.typeScale.
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

  // Transparent overrides are scoped (not :root) so unset fields don't clobber
  // the auto-derive linksWhite/linksDark/linksAccent cascade.
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

  if (props.config.globalStyles?.customCss) lines.push(props.config.globalStyles?.customCss);

  const css = ":root { " + lines.join("\n") + " } " + navRules.join("\n");

  // Generate Google Fonts URL for dynamic loading
  let googleFontsUrl = "";
  if (googleFonts.length > 0) {
    const fontList:string[] = [];
    googleFonts.forEach(f => fontList.push(f.replace(" ", "+") + ":wght@400"));
    googleFontsUrl = "https://fonts.googleapis.com/css2?family=" + fontList.join("&family=") + "&display=swap";
  }

  // Use useEffect to dynamically load fonts in the browser
  React.useEffect(() => {
    if (googleFontsUrl) {
      // Check if font link already exists
      const existingLink = document.querySelector(`link[href="${googleFontsUrl}"]`);
      if (!existingLink) {
        const link = document.createElement("link");
        link.href = googleFontsUrl;
        link.rel = "stylesheet";
        link.type = "text/css";
        document.head.appendChild(link);
      }
    }
  }, [googleFontsUrl]);

  // Execute customJS scripts properly — dangerouslySetInnerHTML doesn't execute <script> tags
  const customJsRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const customJS = props?.config?.globalStyles?.customJS;
    if (!customJS || !customJsRef.current) return;
    const container = customJsRef.current;
    container.innerHTML = customJS;
    const scripts = container.querySelectorAll("script");
    scripts.forEach((orig) => {
      const script = document.createElement("script");
      orig.getAttributeNames().forEach((name) => { script.setAttribute(name, orig.getAttribute(name)); });
      if (orig.textContent) script.textContent = orig.textContent;
      orig.replaceWith(script);
    });
  }, [props?.config?.globalStyles?.customJS]);

  return (<>
    <style jsx>
      {css}
    </style>
    <div ref={customJsRef} />
  </>);
};
