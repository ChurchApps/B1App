import React from "react";
import UserContext from "../../context/UserContext";
import { Box, CssBaseline, List, ThemeProvider } from "@mui/material";
import { SiteWrapper, NavItem } from "../../appBase/components";
import { useRouter } from "next/router";
import { Themes, UserHelper } from "@/appBase/helpers";
import { EnvironmentHelper, PersonHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  config: ConfigurationInterface;
  pageTitle?: string;
  children: React.ReactNode;
}

export const AdminWrapper: React.FC<Props> = (props) => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const tabs = [];
  const router = useRouter();

  const getSelectedTab = () => {
    const path = typeof window !== "undefined" ? window?.location?.pathname : "";
    let result = "admin";
    if (path.startsWith("/site")) result = "site";
    return result;
  };

  const selectedTab = getSelectedTab();

  if (!EnvironmentHelper.shouldHideYourSite(UserHelper.currentUserChurch?.church?.id)) tabs.push(<NavItem key="/" url="/" label="Home" icon="home" router={router} />);

  if (!EnvironmentHelper.shouldHideYourSite(UserHelper.currentUserChurch?.church?.id)) tabs.push(<NavItem key="/admin/site" url="/admin/site" label="Website" icon="web" router={router} selected={selectedTab === "site"} />);
  tabs.push(<NavItem key="/admin" url="/admin" label="Mobile" icon="phone_android" router={router} selected={selectedTab === "donation"} />);

  const navContent = (
    <>
      <List component="nav" sx={Themes.NavBarStyle}>
        {tabs}
      </List>
    </>
  );

  return (
    <ThemeProvider theme={Themes.BaseTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", backgroundColor: "#EEE" }}>
        <SiteWrapper navContent={navContent} context={context} appName="B1" router={router} appearance={props.config.appearance}>
          {props.children}
        </SiteWrapper>
      </Box>
    </ThemeProvider>
  );
};
