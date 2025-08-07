"use client";

import { EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { AppearanceHelper } from "@churchapps/apphelper";
import Head from "next/head";
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

  //These really belong in the head, but if we use Helmet, it won't be rendered in the server side html
  const favicon = props.config?.appearance?.favicon_16x16 && AppearanceHelper.getFavicon(props.config.appearance, "16");
  const ogImage: string | undefined = undefined;

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
    <Head>
      {favicon
        ? <link rel="shortcut icon" type="image/png" href={favicon} />
        : <link rel="icon" href="/favicon.ico" />
      }
      {ogImage && <meta property="og:image" content={ogImage}></meta>}
      <meta property="og:url" content={EnvironmentHelper.Common.B1Root.replace("{key}", props.config?.church?.subDomain)} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={props.config?.church?.name} />
    </Head>
    <style jsx>
      {css}
    </style>
    {customJs}
  </>);
}
