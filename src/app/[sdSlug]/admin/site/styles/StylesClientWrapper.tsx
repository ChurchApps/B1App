"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { ConfigHelper, GlobalStyleInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Grid, Icon, Table, TableBody, TableCell, TableRow } from "@mui/material";
import { DisplayBox, ApiHelper, UserHelper } from "@churchapps/apphelper";
import { PaletteEdit } from "@/components/admin/settings/PaletteEdit";
import { FontsEdit } from "@/components/admin/settings/FontEdit";
import { Preview } from "@/components/admin/settings/Preview";
import { CssEdit } from "@/components/admin/settings/CssEdit";
import { Appearance } from "@/components/admin/Appearance";


export function StylesClientWrapper(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  const [globalStyle, setGlobalStyle] = useState<GlobalStyleInterface>(null);
  const [section, setSection] = useState<string>("");
  const [churchSettings, setChurchSettings] = useState<any>(null);

  const loadData = () => {
    ApiHelper.getAnonymous("/settings/public/" + props.config.church.id, "MembershipApi").then(s => setChurchSettings(s));

    ApiHelper.get("/globalStyles", "ContentApi").then((gs) => {
      if (gs.palette) setGlobalStyle(gs);
      else
        setGlobalStyle({
          palette: JSON.stringify({
            light: "#FFFFFF",
            lightAccent: "#DDDDDD",
            accent: "#0000DD",
            darkAccent: "#9999DD",
            dark: "#000000",
          }),
        });
    });
  };

  const handlePaletteUpdate = (paletteJson: string) => {
    if (paletteJson) {
      let gs = { ...globalStyle };
      gs.palette = paletteJson;
      ApiHelper.post("/globalStyles", [gs], "ContentApi").then(() => loadData());
    }
    ConfigHelper.clearCache("sdSlug=" + UserHelper.currentUserChurch.church.subDomain);
    setSection("");
  };

  const handleFontsUpdate = (fontsJson: string) => {
    if (fontsJson) {
      let gs = { ...globalStyle };
      gs.fonts = fontsJson;
      ApiHelper.post("/globalStyles", [gs], "ContentApi").then(() => loadData());
    }
    ConfigHelper.clearCache("sdSlug=" + UserHelper.currentUserChurch.church.subDomain);
    setSection("");
  };

  const handleUpdate = (gs: GlobalStyleInterface) => {
    if (gs) ApiHelper.post("/globalStyles", [gs], "ContentApi").then(() => loadData());
    ConfigHelper.clearCache("sdSlug=" + UserHelper.currentUserChurch.church.subDomain);
    setSection("");
  };

  useEffect(() => {
    if (!isAuthenticated) redirect("/login");
    else loadData();
  }, []);

  return (
    <AdminWrapper config={props.config}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&family=Lato&family=Montserrat:wght@500&family=Open+Sans:wght@500&family=Oswald:wght@500&family=Playfair+Display:wght@500&family=Poppins:wght@500&family=Raleway:wght@500&family=Roboto:wght@500&display=swap" rel="stylesheet"></link>
      <h1>Manage Global Styles</h1>
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          {section === "palette" && <PaletteEdit globalStyle={globalStyle} updatedFunction={handlePaletteUpdate} />}
          {section === "fonts" && <FontsEdit globalStyle={globalStyle} updatedFunction={handleFontsUpdate} />}
          {section === "css" && <CssEdit globalStyle={globalStyle} updatedFunction={handleUpdate} />}
          {section === "logo" && <Appearance />}
          {section === "" && (
            <Preview globalStyle={globalStyle} churchSettings={churchSettings} churchName={props.config.church.name} />
          )}
        </Grid>
        <Grid item md={4} xs={12}>
          <DisplayBox headerIcon="link" headerText="Style Settings" editContent={false}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>
                    <a href="#" onClick={(e) => { e.preventDefault(); setSection("palette"); }}>
                      <Icon sx={{ marginRight: "5px" }}>palette</Icon>Color Palette
                    </a>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <a href="#" onClick={(e) => { e.preventDefault(); setSection("fonts"); }}>
                      <Icon sx={{ marginRight: "5px" }}>text_fields</Icon>Fonts
                    </a>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <a href="#" onClick={(e) => { e.preventDefault(); setSection("css"); }}>
                      <Icon sx={{ marginRight: "5px" }}>css</Icon>CSS and Javascript
                    </a>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <a href="#" onClick={(e) => { e.preventDefault(); setSection("logo"); }}>
                      <Icon sx={{ marginRight: "5px" }}>image</Icon>Logo
                    </a>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DisplayBox>
        </Grid>
      </Grid>
    </AdminWrapper>
  );
}
