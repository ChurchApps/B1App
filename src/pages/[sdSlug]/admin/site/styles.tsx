import { useEffect, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ConfigHelper, GlobalStyleInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Grid, Icon, Table, TableBody, TableCell, TableRow } from "@mui/material";
import { DisplayBox, ApiHelper } from "@churchapps/apphelper";
import { PaletteEdit } from "@/components/admin/settings/PaletteEdit";
import { FontsEdit } from "@/components/admin/settings/FontEdit";
import { Preview } from "@/components/admin/settings/Preview";
import { CssEdit } from "@/components/admin/settings/CssEdit";
import { Appearance } from "@/components/admin/Appearance";



export default function Colors(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  const [globalStyle, setGlobalStyle] = useState<GlobalStyleInterface>(null);
  const [section, setSection] = useState<string>("");

  const loadData = () => {
    ApiHelper.get("/globalStyles", "ContentApi").then(gs => {
      if (gs.palette) setGlobalStyle(gs);
      else setGlobalStyle({
        palette: JSON.stringify({ light: "#FFFFFF", lightAccent: "#DDDDDD", accent: "#DD0000", darkAccent: "#DD9999", dark: "#000000" })
      })
    });
  }

  const handlePaletteUpdate = (paletteJson:string) => {
    if (paletteJson) {
      let gs = {...globalStyle};
      gs.palette = paletteJson;
      ApiHelper.post("/globalStyles", [gs], "ContentApi").then(() => loadData());
    }
    setSection("");
  }

  const handleFontsUpdate = (fontsJson:string) => {
    if (fontsJson) {
      let gs = {...globalStyle};
      gs.fonts = fontsJson;
      ApiHelper.post("/globalStyles", [gs], "ContentApi").then(() => loadData());
    }
    setSection("");
  }

  const handleUpdate = (gs:GlobalStyleInterface) => {
    if (gs) ApiHelper.post("/globalStyles", [gs], "ContentApi").then(() => loadData());
    setSection("");
  }

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    else loadData();
  }, []);

  return (
    <AdminWrapper config={props.config}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&family=Lato&family=Montserrat:wght@500&family=Open+Sans:wght@500&family=Oswald:wght@500&family=Playfair+Display:wght@500&family=Poppins:wght@500&family=Raleway:wght@500&family=Roboto:wght@500&display=swap" rel="stylesheet"></link>
      <h1>Manage Global Styles</h1>
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          {section==="palette" && <PaletteEdit globalStyle={globalStyle} updatedFunction={handlePaletteUpdate} />}
          {section==="fonts" && <FontsEdit globalStyle={globalStyle} updatedFunction={handleFontsUpdate} />}
          {section==="css" && <CssEdit globalStyle={globalStyle} updatedFunction={handleUpdate} />}
          {section==="logo" && <Appearance />}
          {section==="" && <Preview globalStyle={globalStyle} churchSettings={props.config.church} churchName={props.config.church.name} />}
        </Grid>
        <Grid item md={4} xs={12}>
          <DisplayBox headerIcon="link" headerText="Style Settings" editContent={false}>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell><a href="#" onClick={(e) => { e.preventDefault(); setSection("palette"); }}><Icon sx={{ marginRight: "5px" }}>palette</Icon>Color Palette</a></TableCell></TableRow>
                <TableRow><TableCell><a href="#" onClick={(e) => { e.preventDefault(); setSection("fonts"); }}><Icon sx={{ marginRight: "5px" }}>text_fields</Icon>Fonts</a></TableCell></TableRow>
                <TableRow><TableCell><a href="#" onClick={(e) => { e.preventDefault(); setSection("css"); }}><Icon sx={{ marginRight: "5px" }}>css</Icon>Custom CSS</a></TableCell></TableRow>
                <TableRow><TableCell><a href="#" onClick={(e) => { e.preventDefault(); setSection("logo"); }}><Icon sx={{ marginRight: "5px" }}>image</Icon>Logo</a></TableCell></TableRow>
              </TableBody>
            </Table>
          </DisplayBox>
        </Grid>
      </Grid>



    </AdminWrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
