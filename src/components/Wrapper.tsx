import React from "react";
import UserContext from "../utils/UserContext";
import { Box, CssBaseline, List, ThemeProvider } from "@mui/material";
import { SiteWrapper, NavItem } from "../appBase/components";
import { UserHelper, Permissions } from "@/utils";
import { useRouter } from "next/router"
import { Themes } from "@/appBase/helpers";

interface Props { pageTitle?: string, children: React.ReactNode }

export const Wrapper: React.FC<Props> = props => {
  const context = React.useContext(UserContext);
  const tabs = []
  const router = useRouter();

  const getSelectedTab = () => {
    let result = "";
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/admin")) result = "admin";
      else if (path.startsWith("/cp")) result = "cp";
    }
    return result;
  }

  const selectedTab = getSelectedTab();

  tabs.push(<NavItem url="/" label="Home" icon="home" router={router} />);
  if (UserHelper.checkAccess(Permissions.lessonsApi.lessons.edit)) tabs.push(<NavItem url="/admin" label="Admin" icon="admin_panel_settings" router={router} selected={selectedTab === "admin"} key="admin" />);
  if (UserHelper.checkAccess(Permissions.lessonsApi.lessons.editSchedules)) tabs.push(<NavItem url="/cp" label="Schedules" icon="calendar_month" router={router} selected={selectedTab === "cp"} key="cp" />);

  const navContent = <><List component="nav" sx={Themes.NavBarStyle}>{tabs}</List></>


  return <ThemeProvider theme={Themes.BaseTheme}>
    <CssBaseline />
    <Box sx={{ display: "flex", backgroundColor: "#EEE" }}>
      <SiteWrapper navContent={navContent} context={context} appName="Lessons.church" router={router} >{props.children}</SiteWrapper>
    </Box>
  </ThemeProvider>

};
