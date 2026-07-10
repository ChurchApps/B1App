import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layouts/Footer";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { ApiHelper } from "@churchapps/apphelper";
import { CssBaseline } from "@mui/material";

type Props = {
  overlayContent?: boolean;
  ogDescription?: string;
  config?: ConfigurationInterface
  children: React.ReactNode;
  linkColor?: string;
};


//add helmet here

export async function DefaultPageWrapper(props: Props) {
  const a = 0;
  const config = props.config as ConfigurationInterface;

  const footerSections = await ApiHelper.getAnonymous("/blocks/public/footer/" + config.church.id + (config.siteId ? "?siteId=" + config.siteId : ""), "ContentApi");

  return (<>
    <CssBaseline />
    <div>
      <Header config={config} overlayContent={!!props.overlayContent} sections={[]} linkColor={props.linkColor} />
      <main id="main-content">
        <div className="page">
          {!props.overlayContent && <div style={{ paddingTop: 90 }}></div>}

          {props.children}

          {!props.overlayContent && <div style={{ paddingBottom: 90 }}></div>}
        </div>
      </main>
      <Footer config={config} footerSections={footerSections} />
    </div>
  </>);


}
