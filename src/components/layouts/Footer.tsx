import { SectionInterface } from "@/helpers";
import { AppearanceHelper, ChurchInterface } from "@churchapps/apphelper";
import Zone from "./Zone";
import { Grid } from "@mui/material";


type Props = {
  footerSections?: SectionInterface[];
  churchSettings?: any;
  church?: ChurchInterface;
};

export function Footer(props: Props) {

  if (props.footerSections?.length>0) {
    console.log("Footer Sections", props.footerSections.length, props.footerSections[0].elements?.length);

    return <Zone church={props.church} sections={props.footerSections} zone="siteFooter" churchSettings={props.churchSettings} />
  }
  else {
    let logoUrl = AppearanceHelper.getLogoDark(props.churchSettings.appearance ?? props.churchSettings, "/images/logo.png");
    const photo = <img src={logoUrl} className="img-fluid" id={"el-footer-logo"} alt={props.church.name} />

    return (
      <>
        <div className="section headingsLight linksLightAccent" style={{backgroundColor:"var(--dark)", color:"var(--light)", paddingTop:40, paddingBottom:40 }}>
          <Grid container spacing={2} className="container">
            <Grid item xs={12} md={6}>
              {photo}
            </Grid>
            <Grid item xs={12} md={6}>
              <h2>{props.church.name}</h2>
              <p>
                {props.church.address1}<br />
                {props.church.city && <>{props.church.city}, {props.church.state} {props.church.zip}</>}
              </p>
            </Grid>
          </Grid>
        </div>
      </>
    );
  }
}
