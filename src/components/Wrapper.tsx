import React from "react";
import UserContext from "../UserContext";
import { Box, CssBaseline, List, ThemeProvider } from "@mui/material";
import { SiteWrapper, NavItem } from "../appBase/components";
import { useRouter } from "next/router"
import { Themes } from "@/appBase/helpers";

interface Props { pageTitle?: string, children: React.ReactNode }

export const Wrapper: React.FC<Props> = props => {
  const context = React.useContext(UserContext);
  const tabs = []
  const router = useRouter();

  tabs.push(<NavItem url="/" label="Home" icon="home" router={router} />);

  const navContent = <><List component="nav" sx={Themes.NavBarStyle}>{tabs}</List></>

  return <ThemeProvider theme={Themes.BaseTheme}>
    <CssBaseline />
    <Box sx={{ display: "flex", backgroundColor: "#EEE" }}>
      <SiteWrapper navContent={navContent} context={context} appName="YourSite.church" router={router} >{props.children}</SiteWrapper>
    </Box>
  </ThemeProvider>

};
