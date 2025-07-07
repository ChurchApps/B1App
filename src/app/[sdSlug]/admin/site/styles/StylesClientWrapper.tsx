"use client";

import { useEffect, useState } from "react";
import { BlockInterface, ConfigHelper, GlobalStyleInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import Head from 'next/head';
import { Grid, Icon, Table, TableBody, TableCell, TableRow } from "@mui/material";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { Banner } from "@churchapps/apphelper/dist/components/header/Banner";
import { PaletteEdit } from "@/components/admin/settings/PaletteEdit";
import { FontsEdit } from "@/components/admin/settings/FontEdit";
import { Preview } from "@/components/admin/settings/Preview";
import { CssEdit } from "@/components/admin/settings/CssEdit";
import { Appearance } from "@/components/admin/Appearance";
import { useRouter } from "next/navigation";


export function StylesClientWrapper(props: WrapperPageProps) {
  const router = useRouter();
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
    loadData();
  }, []);

  const getFooter = async () => {
    const existing = await ApiHelper.get("/blocks/blockType/footerBlock", "ContentApi");
    if (existing.length > 0) router.push("/admin/site/blocks/" + existing[0].id);
    else {
      const block:BlockInterface = { name: "Site Footer", blockType: "footerBlock" };
      ApiHelper.post("/blocks", [block], "ContentApi").then((data) => {
        router.push("/admin/site/blocks/" + data[0].id);
      });
    }
  }

  return (
    <AdminWrapper config={props.config}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400&family=Lato&family=Montserrat:wght@400&family=Open+Sans:wght@400&family=Oswald:wght@400&family=Playfair+Display:wght@400&family=Poppins:wght@400&family=Raleway:wght@400&family=Roboto:wght@400&display=swap" rel="stylesheet" />
      </Head>
      <Banner><h1>Manage Global Styles</h1></Banner>
      <div id="mainContent">
        <Grid container spacing={3}>
          <Grid size={{ md: 8, xs: 12 }}>
            {section === "palette" && <PaletteEdit globalStyle={globalStyle} updatedFunction={handlePaletteUpdate} />}
            {section === "fonts" && <FontsEdit globalStyle={globalStyle} updatedFunction={handleFontsUpdate} />}
            {section === "css" && <CssEdit globalStyle={globalStyle} updatedFunction={handleUpdate} />}
            {section === "logo" && <Appearance />}
            {section === "" && (
              <Preview globalStyle={globalStyle} churchSettings={churchSettings} churchName={props.config.church.name} />
            )}
          </Grid>
          <Grid size={{ md: 4, xs: 12 }}>
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
                  <TableRow>
                    <TableCell>
                      <a href="#" onClick={(e) => { e.preventDefault(); getFooter(); }}>
                        <Icon sx={{ marginRight: "5px" }}>smart_button</Icon>Site Footer
                      </a>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </DisplayBox>
          </Grid>
        </Grid>
      </div>
    </AdminWrapper>
  );
}
