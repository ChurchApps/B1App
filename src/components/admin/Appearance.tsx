import React, { useState } from "react";
import { ApiHelper, AppearanceHelper, AppearanceInterface, DisplayBox, GenericSettingInterface } from "@churchapps/apphelper"
import { AppearanceEdit } from "./AppearanceEdit";
import { Box, Grid } from "@mui/material";

interface Props { }

export const Appearance: React.FC<Props> = (props) => {
  const [currentSettings, setCurrentSettings] = useState<GenericSettingInterface[]>([]);
  const [mode, setMode] = useState("display");
  const [styles, setStyles] = useState<AppearanceInterface>({});

  const loadData = () => { ApiHelper.get("/settings", "MembershipApi").then(settings => { setCurrentSettings(settings); configureStyles(settings) }) }
  const handleEdit = () => { setMode("edit"); }
  const handleUpdate = () => { setMode("display"); loadData(); }

  const getLogo = (logoName: string) => {
    let logoSrc;
    if(logoName === "logoLight") logoSrc = AppearanceHelper.getLogoLight(styles, "/images/sample-logo-header.png");
    if(logoName === "logoDark") logoSrc = AppearanceHelper.getLogoDark(styles, "/images/sample-logo-header.png");
    if(logoName === "favicon_400x400") logoSrc = AppearanceHelper.getFavicon(styles, "400");
    if (logoName === "ogImage") logoSrc = styles?.ogImage ? styles.ogImage : "";
    let logoImg = (styles && logoSrc !== null && logoSrc !== undefined) ? <img src={logoSrc} alt="logo" /> : null;
    return logoImg
  }

  const getDefaultStyles = () => ({
    primaryColor: "#08A0CC",
    primaryContrast: "#FFFFFF",
    secondaryColor: "#FFBA1A",
    secondaryContrast: "#000000"
  })

  const configureStyles = (settings: GenericSettingInterface[]) => {
    let style: any = getDefaultStyles();
    settings.map(s => { style[s.keyName] = s.value; return null });
    setStyles(style);
  }

  React.useEffect(loadData, []); //eslint-disable-line

  if (mode === "edit") return (<AppearanceEdit settings={currentSettings} updatedFunction={handleUpdate} />)
  else return (
    <DisplayBox headerIcon="palette" headerText="Church Appearance" editFunction={handleEdit}>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <div style={{ padding: 10, fontWeight: "bold", textAlign: "center", backgroundColor: "#EEE" }}>
            {getLogo("logoLight")}
          </div>
        </Grid>
        <Grid item xs={12} md={6}>
          <div style={{ padding: 10, fontWeight: "bold", textAlign: "center", backgroundColor: "#333", color: "#FFF" }}>
            {getLogo("logoDark")}
          </div>
        </Grid>
      </Grid>
      <br />
      <Grid container spacing={2}>
        {styles?.ogImage && (
          <Grid item xs={12} md={styles?.favicon_400x400 ? 8 : 12}>
            <Box sx={{  padding: "10px", fontWeight: "bold", textAlign: "center", backgroundColor: "#3f51b5", color: "#FFF", display: "flex", justifyContent: "center", alignItems: "center" }} component="div">
              <Box sx={{ maxWidth: 600, maxHeight: 315 }} component="div">
                {getLogo("ogImage")}
              </Box>
            </Box>
          </Grid>
        )}
        {styles?.favicon_400x400 && (
          <Grid item xs={12} md={styles?.ogImage ? 4 : 12}>
            <Box sx={{ padding: "10px", fontWeight: "bold", textAlign: "center", backgroundColor: "#bbdefb", color: "#FFF", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }} component="div">
              <Box sx={{ maxWidth: { xs: 150, md: 200, lg: 300}, maxHeight: { xs: 150, md: 200, lg: 300 } }} component="div">
                {getLogo("favicon_400x400")}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      <div style={{ backgroundColor: styles.primaryColor, color: styles.primaryContrast, padding: 5, fontWeight: "bold" }}>
        Primary Colors
      </div>
      <div style={{ backgroundColor: styles.secondaryColor, color: styles.secondaryContrast, padding: 5, fontWeight: "bold" }}>
        Secondary Colors
      </div>

    </DisplayBox>
  );
}
