import React from "react";
import UserContext from "../context/UserContext";
import { Box, CssBaseline, List, ThemeProvider } from "@mui/material";
import { useRouter } from "next/router"
import { Themes, SiteWrapper, NavItem, UserHelper, Permissions } from "@churchapps/apphelper";
import { PersonHelper } from "@/helpers"
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props { config: ConfigurationInterface, pageTitle?: string, children: React.ReactNode }

export const Wrapper: React.FC<Props> = props => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const tabs:any = []
  const router = useRouter();

  const getSelectedTab = () => {
    const path = (typeof window !== "undefined") ? window?.location?.pathname : "";
    let result = "";
    if (path.startsWith("/member/donate")) result = "donation";
    else if (path.startsWith("/member/checkin")) result = "checkin";
    else if (path.startsWith("/member/stream")) result = "stream";
    else if (path.startsWith("/member/lessons")) result = "lessons";
    else if (path.startsWith("/member/directory")) result = "directory";
    else if (path.startsWith("/member/url")) result = "url";
    else if (path.startsWith("/member/bible")) result = "bible";
    else if (path.startsWith("/member/pages")) result = "page";
    else if (path.startsWith("/member/votd")) result = "votd";
    else if (path.startsWith("/member/groups")) result = "groups";
    else if (path.match("/member")) result = "member";
    return result;
  }

  const selectedTab = getSelectedTab();

  tabs.push(<NavItem key="/" url="/" label="Home" icon="home" router={router} />);
  tabs.push(<NavItem key="/member" url="/member" label="Member" icon="person" router={router} selected={selectedTab === "member"} />)

  props.config.tabs?.forEach(tab => {
    switch (tab.linkType) {
      case "donation":
        tabs.push(<NavItem key="/member/donate" url="/member/donate" label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "donation"} />)
        break;
      case "donationLanding":
        tabs.push(<NavItem key="/member/donation-landing" url="/member/donation-landing" label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "donation"} />)
        break;
      case "checkin":
        tabs.push(<NavItem key="/member/checkin" url="/member/checkin" label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "checkin"} />)
        break
      case "stream":
        tabs.push(<NavItem key="/member/stream" url="/member/stream" label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "stream"} />)
        break
      case "lessons":
        tabs.push(<NavItem key="/member/lessons" url="/member/lessons" label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "lessons"} />)
        break
      case "directory":
        tabs.push(<NavItem key="/member/directory" url="/member/directory" label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "directory"} />)
        break
      case "url":
        tabs.push(<NavItem key={`/member/url/${tab.id}`} url={`/member/url/${tab.id}`} label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "url" && window?.location?.href?.indexOf(tab.id) > -1} />)
        break
      case "bible":
        tabs.push(<NavItem key="/member/bible" url="/member/bible" label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "bible"} />)
        break
      case "page":
        let url = `/member/pages/${tab.churchId}/${tab.linkData}`;
        if (tab.url) url += "?url=" + tab.url;
        tabs.push(<NavItem key={url} url={url} label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "page"} />)
        break
      case "votd":
        tabs.push(<NavItem key="/member/votd" url="/member/votd" label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "votd"} />)
        break
      case "groups":
        tabs.push(<NavItem key="/member/groups" url="/member/groups" label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "groups"} />)
        break
      default:
        break
    }
  })

  const adminAccess = UserHelper.checkAccess(Permissions.contentApi.content.edit);
  if (adminAccess) tabs.push(<NavItem key="/admin" url="/admin" label="Admin" icon="settings" router={router} />);

  const navContent = <><List component="nav" sx={Themes.NavBarStyle}>{tabs}</List></>


  return <ThemeProvider theme={Themes.BaseTheme}>
    <CssBaseline />
    <Box sx={{ display: "flex", backgroundColor: "#EEE" }}>
      <SiteWrapper navContent={navContent} context={context} appName="B1" router={router} appearance={props.config.appearance}>{props.children}</SiteWrapper>
    </Box>
  </ThemeProvider>


};
