"use client";

import React, { useEffect, useState } from "react";
import { BlockInterface, ConfigHelper, GlobalStyleInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import Head from 'next/head';
import { Grid, Box, Card, CardContent, Stack, Typography } from "@mui/material";
import {
  Palette as PaletteIcon,
  TextFields as TextFieldsIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  SmartButton as SmartButtonIcon,
  Style as StyleIcon
} from "@mui/icons-material";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { PaletteEdit } from "@/components/admin/settings/PaletteEdit";
import { FontsEdit } from "@/components/admin/settings/FontEdit";
import { Preview } from "@/components/admin/settings/Preview";
import { CssEdit } from "@/components/admin/settings/CssEdit";
import { Appearance } from "@/components/admin/Appearance";
import { useRouter } from "next/navigation";
import { PageHeader, CardWithHeader } from "@/components/ui";


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

  const styleOptions = [
    {
      id: "palette",
      icon: <PaletteIcon />,
      title: "Color Palette",
      description: "Customize your site's color scheme",
      action: () => setSection("palette")
    },
    {
      id: "fonts",
      icon: <TextFieldsIcon />,
      title: "Fonts",
      description: "Select and customize typography",
      action: () => setSection("fonts")
    },
    {
      id: "css",
      icon: <CodeIcon />,
      title: "CSS & Javascript",
      description: "Add custom styles and scripts",
      action: () => setSection("css")
    },
    {
      id: "logo",
      icon: <ImageIcon />,
      title: "Logo",
      description: "Upload and manage your logo",
      action: () => setSection("logo")
    },
    {
      id: "footer",
      icon: <SmartButtonIcon />,
      title: "Site Footer",
      description: "Customize your site footer",
      action: getFooter
    }
  ];

  return (
    <AdminWrapper config={props.config}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400&family=Lato&family=Montserrat:wght@400&family=Open+Sans:wght@400&family=Oswald:wght@400&family=Playfair+Display:wght@400&family=Poppins:wght@400&family=Raleway:wght@400&family=Roboto:wght@400&display=swap" rel="stylesheet" />
      </Head>

      <PageHeader
        icon={<StyleIcon />}
        title="Site Styles"
        subtitle="Below is a preview of a sample site with your colors, fonts and logos. This is not your actual site content."
      />

      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {section === "palette" && <PaletteEdit globalStyle={globalStyle} updatedFunction={handlePaletteUpdate} />}
            {section === "fonts" && <FontsEdit globalStyle={globalStyle} updatedFunction={handleFontsUpdate} />}
            {section === "css" && <CssEdit globalStyle={globalStyle} updatedFunction={handleUpdate} />}
            {section === "logo" && <Appearance />}
            {section === "" && (
              <Preview globalStyle={globalStyle} churchSettings={churchSettings} churchName={props.config.church.name} />
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <CardWithHeader
              title="Style Settings"
              icon={<StyleIcon sx={{ color: 'primary.main' }} />}
            >
              <Stack spacing={2}>
                {styleOptions.map((option) => (
                  <Card
                    key={option.id}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      border: '1px solid',
                      borderColor: section === option.id ? 'primary.main' : 'grey.200',
                      backgroundColor: section === option.id ? 'primary.50' : 'transparent',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={option.action}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            backgroundColor: section === option.id ? 'primary.main' : 'rgba(25, 118, 210, 0.1)',
                            borderRadius: '8px',
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 40,
                            height: 40
                          }}
                        >
                          {React.cloneElement(option.icon, {
                            sx: {
                              fontSize: 20,
                              color: section === option.id ? '#FFF' : 'primary.main'
                            }
                          })}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              color: section === option.id ? 'primary.main' : 'text.primary'
                            }}
                          >
                            {option.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.875rem'
                            }}
                          >
                            {option.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardWithHeader>
          </Grid>
        </Grid>
      </Box>
    </AdminWrapper>
  );
}
