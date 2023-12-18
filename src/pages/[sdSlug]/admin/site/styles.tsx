import { useEffect, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ConfigHelper, GlobalStyleInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Grid, Icon } from "@mui/material";
import { DisplayBox, ApiHelper } from "@churchapps/apphelper";
import { PaletteEdit } from "@/components/admin/settings/PaletteEdit";



export default function Colors(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  const [globalStyle, setGlobalStyle] = useState<GlobalStyleInterface>(null);
  const [section, setSection] = useState<string>("palette");

  const loadData = () => {
    ApiHelper.get("/globalStyles", "ContentApi").then(gs => {
      if (gs.palette) setGlobalStyle(gs);
      else setGlobalStyle({
        pallette: JSON.stringify({ light: "#FFFFFF", lightAccent: "#DDDDDD", accent: "#DD0000", darkAccent: "#DD9999", dark: "#000000" })
      })
    });
  }

  const handlePaletteUpdate = (paletteJson:string) => {
    if (paletteJson) {
      let gs = {...globalStyle};
      gs.pallette = paletteJson;
      ApiHelper.post("/globalStyles", [gs], "ContentApi").then(() => loadData());
    }
    setSection("");
  }

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    else loadData();
  }, []);

  return (
    <AdminWrapper config={props.config}>
      <h1>Manage Global Styles</h1>
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          {section==="palette" && <PaletteEdit globalStyle={globalStyle} updatedFunction={handlePaletteUpdate} />}
        </Grid>
        <Grid item md={4} xs={12}>
          <DisplayBox headerIcon="link" headerText="Style Settings" editContent={false}>
            <table className="table">
              <tbody>
                <tr><td><a href="#" onClick={(e) => { e.preventDefault(); setSection("palette"); }}><Icon sx={{ marginRight: "5px" }}>palette</Icon>Color Palette</a></td></tr>
                <tr><td><a href="#"><Icon sx={{ marginRight: "5px" }}>description</Icon>Fonts</a></td></tr>
                <tr><td><a href="#"><Icon sx={{ marginRight: "5px" }}>palette</Icon>Custom CSS</a></td></tr>
              </tbody>
            </table>
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
