"use client";

import { SectionInterface } from "@/helpers";
import { AppearanceHelper, Locale } from "@churchapps/apphelper";
import Zone from "./Zone";
import { Grid } from "@mui/material";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import Link from "next/link";


type Props = {
  footerSections?: SectionInterface[];
  config?: ConfigurationInterface;
};

export function Footer(props: Props) {

  if ((props.footerSections?.length ?? 0) > 0) {
    return <footer><Zone church={props.config?.church!} sections={props.footerSections!} zone="siteFooter" churchSettings={props.config?.appearance!} /></footer>;
  } else {
    const logoUrl = AppearanceHelper.getLogoDark(props.config?.appearance!, "/images/logo.png");
    const photo = logoUrl ? <img src={logoUrl} className="img-fluid" id={"el-footer-logo"} alt={props.config?.church.name} style={{ maxWidth: "200px" }} /> : null;

    const navLinks = (props.config?.navLinks || []).filter((l) => !l.parentId && l.url);
    const links = navLinks.length > 0
      ? navLinks
      : (props.config?.allowDonations ? [{ id: "give", text: Locale.label("footer.give"), url: "/donate" }] : []);

    return (
      <footer>
        <div className="section headingsLight linksLightAccent" style={{ backgroundColor: "var(--dark)", color: "var(--light)", paddingTop: 40, paddingBottom: 40 }}>
          <Grid container spacing={2} className="container">
            <Grid size={{ xs: 12, md: 6 }}>
              {photo}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <h2>{props.config?.church.name}</h2>
              <p>
                {props.config?.church.address1}<br />
                {props.config?.church.city && <>{props.config?.church.city}, {props.config?.church.state} {props.config?.church.zip}</>}
              </p>
              {links.length > 0 && (
                <nav aria-label={Locale.label("footer.nav")} style={{ marginTop: 16 }}>
                  {links.map((l) => <Link key={l.id} href={l.url || "/"} style={{ color: "var(--light)", marginRight: 16 }} data-testid={`footer-nav-${l.id}`}>{l.text}</Link>)}
                </nav>
              )}
            </Grid>
          </Grid>
        </div>
      </footer>
    );
  }
}
