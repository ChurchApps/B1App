"use client";

import React from "react";
import UserContext from "../../context/UserContext";
import { Box, CssBaseline, List } from "@mui/material";
import { SiteWrapper, NavItem } from "@churchapps/apphelper";
import { PersonHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Themes } from "@/helpers/Themes";
import { useRouter } from "next/navigation";

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

    if (path.startsWith("/admin/video")) result = "sermons";
    else if (path.startsWith("/admin/calendar")) result = "calendar";
    else if (path.startsWith("/admin/site")) result = "site";
    return result;
  };

  const selectedTab = getSelectedTab();

  const handleNavClick = (url: string) => {
    router.push(url);
  }


  tabs.push(<NavItem key="/" url="/" label="Home" icon="home" onNavigate={handleNavClick} />);
  tabs.push(<NavItem key="/member" url="/member" label="Member" icon="person" onNavigate={handleNavClick} />)

  tabs.push(<NavItem key="admin" url="/admin" label="Mobile" icon="phone_android" onNavigate={handleNavClick} selected={selectedTab === "admin"} />);
  tabs.push(<NavItem key="site" url="/admin/site" label="Website" icon="web" onNavigate={handleNavClick} selected={selectedTab === "site"} />);
  tabs.push(<NavItem key="sermons" url="/admin/video" label="Sermons" icon="live_tv" onNavigate={handleNavClick} selected={selectedTab === "sermons"} />);
  tabs.push(<NavItem key="calendar" url="/admin/calendars" label="Calendars" icon="calendar_month" onNavigate={handleNavClick} selected={selectedTab === "calendar"} />);

  const navContent = (
    <>
      <List component="nav" sx={Themes.NavBarStyle}>
        {tabs}
      </List>
    </>
  );

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: "flex", backgroundColor: "#EEE" }}>
        <SiteWrapper navContent={navContent} context={context} appName="B1" onNavigate={handleNavClick} appearance={props.config.appearance} omitOverflow={true}>
          {props.children}
        </SiteWrapper>
      </Box>
    </>
  );
};
