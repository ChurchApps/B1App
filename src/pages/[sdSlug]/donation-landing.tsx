import { GetStaticPaths, GetStaticProps } from "next";
import { GiveNowPanel, Layout, LoadingPage, SignInPanel } from "@/components";
import { Section } from "@/components/Section";
import pageData from "../../samplePages/newhere.json";
import { ApiHelper, AppearanceHelper, ChurchInterface, ConfigHelper, EnvironmentHelper, LinkInterface } from "@/helpers";
import { Navigate } from "react-router-dom";
import { TabContext, TabPanel } from "@mui/lab";
import { Box, Card, Tabs, Tab } from "@mui/material";
import { useEffect, useState } from "react";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { SubdomainHelper } from "@/helpers/SubdomainHelper";

type Props = {
  sdSlug: string
};

export default function DonationLanding(props: Props) {
  const [value, setValue] = useState("0");


  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };


  const [config, setConfig] = useState<ConfigurationInterface>({} as ConfigurationInterface)

  const loadConfig = () => {
    SubdomainHelper.subDomain = props.sdSlug;

    ConfigHelper.load(SubdomainHelper.subDomain).then(data => {
      setConfig(data);
    })
  }

  useEffect(loadConfig, [])

  if (config.keyName === undefined) {
    return <LoadingPage config={config} />
  } else {
    const logoSrc = AppearanceHelper.getLogoLight(ConfigHelper?.current?.appearance, "/images/logo.png");
    return (
      <Box
        sx={{
          backgroundColor: "#f9f9f9",
          minHeight: "100vh"
        }}
      >
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
                <GiveNowPanel />
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
}

export const getStaticPaths: GetStaticPaths = async () => {

  const paths = [
    { params: { sdSlug: "crcc" } },
    { params: { sdSlug: "ironwood" } },
  ];

  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {

  return {
    props: { sdSlug: params.sdSlug },
    revalidate: 30,
  };
};
