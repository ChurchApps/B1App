import { useState } from "react";
import { Wrapper } from "@/components/Wrapper";
import { Tab, Box } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { YourSiteSettings, B1Settings } from "@/components";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"b1" | "yoursite">("yoursite");

  return (
    <Wrapper>
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={(_, value) => setActiveTab(value)} aria-label="lab API tabs example">
            <Tab label="Your Site Settings" value="yoursite" />
            <Tab label="B1 Settings" value="b1" />
          </TabList>
        </Box>
        <TabPanel value="yoursite">
          <YourSiteSettings />
        </TabPanel>
        <TabPanel value="b1">
          <B1Settings />
        </TabPanel>
      </TabContext>
    </Wrapper>
  );
}
