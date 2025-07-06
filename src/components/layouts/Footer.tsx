"use client";

import { SectionInterface } from "@/helpers";
import { AppearanceHelper } from "@churchapps/apphelper/dist/helpers/AppearanceHelper";
import Zone from "./Zone";
import { Grid } from "@mui/material";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";


type Props = {
  footerSections?: SectionInterface[];
  config?: ConfigurationInterface;
};

export function Footer(props: Props) {

  if (props.footerSections?.length>0) {
    return <Zone church={props.config?.church} sections={props.footerSections} zone="siteFooter" churchSettings={props.config?.appearance} />
  }
  else {
    let logoUrl = AppearanceHelper.getLogoDark(props.config?.appearance, "/images/logo.png");
    const photo = <img src={logoUrl} className="img-fluid" id={"el-footer-logo"} alt={props.config?.church.name} />

    return (
      <>
        <div className="section headingsLight linksLightAccent" style={{backgroundColor:"var(--dark)", color:"var(--light)", paddingTop:40, paddingBottom:40 }}>
          <Grid container spacing={2} className="container">
            <Grid item xs={12} md={6}>
              {photo}
            </Grid>
            <Grid item xs={12} md={6}>
              <h2>{props.config?.church.name}</h2>
              <p>
                {props.config?.church.address1}<br />
                {props.config?.church.city && <>{props.config?.church.city}, {props.config?.church.state} {props.config?.church.zip}</>}
              </p>
            </Grid>
          </Grid>
        </div>
      </>
    );
  }
}
