import { useState } from "react";
import { Box, Card, Tabs, Tab } from "@mui/material";
import { TabPanel, TabContext } from "@mui/lab";
import { ConfigHelper, AppearanceHelper } from "@/helpers";
import { GiveNowPanel, SignInPanel } from "@/components";

export default function DonationLanding() {
  const [value, setValue] = useState("0");
  const logoSrc = AppearanceHelper.getLogoLight(ConfigHelper.current.appearance, "/images/logo.png");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f9f9f9",
        minHeight: "100vh",
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
