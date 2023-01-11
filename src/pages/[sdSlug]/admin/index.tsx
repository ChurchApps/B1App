import { useEffect, useState } from "react";
import { Wrapper } from "@/components/Wrapper";
import { Tab, Box } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { YourSiteSettings, B1Settings } from "@/components";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ApiHelper, EnvironmentHelper } from "@/helpers";

interface Props {
  sdSlug: string;
}

export default function Admin(props: Props) {
  const [activeTab, setActiveTab] = useState<"b1" | "yoursite">((EnvironmentHelper.HideYoursite) ? "b1" : "yoursite");
  const { isAuthenticated } = ApiHelper;

  useEffect(() => { if (!isAuthenticated) { router.push("/login"); } }, []);

  return (
    <Wrapper sdSlug={props.sdSlug}>
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={(_, value) => setActiveTab(value)} aria-label="lab API tabs example">
            {!EnvironmentHelper.HideYoursite && (<Tab label="Your Site Settings" value="yoursite" />)}
            <Tab label="B1 Settings" value="b1" />
          </TabList>
        </Box>
        {!EnvironmentHelper.HideYoursite && (
          <TabPanel value="yoursite">
            <YourSiteSettings />
          </TabPanel>
        )}
        <TabPanel value="b1">
          <B1Settings />
        </TabPanel>
      </TabContext>
    </Wrapper>
  );
}


export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {

  return {
    props: { sdSlug: params.sdSlug },
    revalidate: 30,
  };
};

