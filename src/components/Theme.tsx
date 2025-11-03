"use client";

import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import React from "react";

interface Props { config?:ConfigurationInterface }

export const Theme: React.FC<Props> = (props) => {

  let css = null;
  const googleFonts = [];
  let customJs = <></>;
  const lines:string[] = []


  if (props.config.globalStyles?.palette) {
    const palette = JSON.parse(props.config.globalStyles?.palette);
    lines.push("--light: " + palette.light + ";");
    lines.push("--lightAccent: " + palette.lightAccent + ";");
    lines.push("--accent: " + palette.accent + ";");
    lines.push("--darkAccent: " + palette.darkAccent + ";");
    lines.push("--dark: " + palette.dark + ";");
  }


  if (props.config.globalStyles?.fonts) {
    const fonts = JSON.parse(props.config.globalStyles?.fonts);
    lines.push("--headingFont: '" + fonts.heading + "';");
    lines.push("--bodyFont: '" + fonts.body + "';");
    if (fonts.heading!=="Roboto") googleFonts.push(fonts.heading);
    if (fonts.body !== fonts.heading) googleFonts.push(fonts.body);
  }

  if (props.config.globalStyles?.customCss) lines.push(props.config.globalStyles?.customCss);

  css = ":root { " + lines.join("\n") + " }";

  if (props?.config.globalStyles?.customJS) customJs = <div dangerouslySetInnerHTML={{__html:props.config.globalStyles.customJS}} />

  // Generate Google Fonts URL for dynamic loading
  let googleFontsUrl = "";
  if (googleFonts.length > 0) {
    const fontList:string[] = [];
    googleFonts.forEach(f => fontList.push(f.replace(" ","+") + ":wght@400"));
    googleFontsUrl = "https://fonts.googleapis.com/css2?family=" + fontList.join("&family=") + "&display=swap";
  }

  // Use useEffect to dynamically load fonts in the browser
  React.useEffect(() => {
    if (googleFontsUrl) {
      // Check if font link already exists
      const existingLink = document.querySelector(`link[href="${googleFontsUrl}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.href = googleFontsUrl;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        document.head.appendChild(link);
      }
    }
  }, [googleFontsUrl]);

  return (<>
    <style jsx>
      {css}
    </style>
    {customJs}
  </>);
}
