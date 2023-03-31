import { GetStaticPaths, GetStaticProps } from "next";
import { GiveNowPanel, SignInPanel } from "@/components";
import { AppearanceHelper, ConfigHelper, WrapperPageProps } from "@/helpers";
import { TabContext, TabPanel } from "@mui/lab";
import { Box, Card, Tabs, Tab } from "@mui/material";
import { useState } from "react";

export default function DonationLanding(props: WrapperPageProps) {
  const [value, setValue] = useState("0");


  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const logoSrc = AppearanceHelper.getLogoLight(props.config.appearance, "/images/logo.png");
  return (
    <Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: "930px", margin: "auto", paddingY: "72px" }}>
        <Card>
          <Box sx={{ paddingTop: 8, paddingX: 10, paddingBottom: 3 }}>
            <img src={logoSrc} alt="logo" />
          </Box>
          <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={value} onChange={handleChange} aria-label="actions" centered>
                <Tab label="Give Now" sx={{ textTransform: "unset" }} aria-controls="give-now" value="0" />
                <Tab label="Sign In" sx={{ textTransform: "unset" }} aria-controls="sign-in" value="1" />
              </Tabs>
            </Box>
            <TabPanel value="0">
              <GiveNowPanel churchId={props.config.church.id} />
            </TabPanel>
            <TabPanel value="1">
              <SignInPanel />
            </TabPanel>
          </TabContext>
        </Card>
      </Box>
    </Box>
  );

}

export const getStaticPaths: GetStaticPaths = async () => {

  const paths:any[] = [];

  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return {
    props: { config },
    revalidate: 30,
  };
};
