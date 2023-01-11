import React, { useEffect, useState } from "react";
import UserContext from "../context/UserContext";
import { Box, CssBaseline, List, ThemeProvider } from "@mui/material";
import { SiteWrapper, NavItem } from "../appBase/components";
import { useRouter } from "next/router"
import { Themes } from "@/appBase/helpers";
import { ConfigHelper, EnvironmentHelper, PersonHelper } from "@/helpers"
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { SubdomainHelper } from "@/helpers/SubdomainHelper";
import { LoadingPage } from "./LoadingPage";

interface Props { pageTitle?: string, children: React.ReactNode }

export const Wrapper: React.FC<Props> = props => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const tabs = []
  const router = useRouter();
  const [config, setConfig] = useState<ConfigurationInterface>({} as ConfigurationInterface)

  const loadConfig = () => {
    if (window) {
      SubdomainHelper.subDomain = window.location.hostname.split(".")[0];
      ConfigHelper.load(SubdomainHelper.subDomain).then(data => { setConfig(data); })
    }
  }

  useEffect(loadConfig, [])


  const getSelectedTab = () => {
    const path = (typeof window === "undefined") ? "" : window.location.pathname;
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
    return result;
  }

  const selectedTab = getSelectedTab();

  if (!EnvironmentHelper.HideYoursite) tabs.push(<NavItem key="/" url="/" label="Home" icon="home" router={router} />);

  ConfigHelper.current?.tabs?.forEach(tab => {
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
        tabs.push(<NavItem key={`/member/pages/${tab.churchId}/${tab.linkData}`} url={`/member/pages/${tab.churchId}/${tab.linkData}`} label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "page"} />)
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

  tabs.push(<NavItem key="/admin" url="/admin" label="Admin" icon="settings" router={router} />);

  const navContent = <><List component="nav" sx={Themes.NavBarStyle}>{tabs}</List></>


  if (window && config.keyName === undefined) {
    return <LoadingPage config={config} />
  } else {
    return <ThemeProvider theme={Themes.BaseTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", backgroundColor: "#EEE" }}>
        <SiteWrapper navContent={navContent} context={context} appName="B1" router={router} >{props.children}</SiteWrapper>
      </Box>
    </ThemeProvider>
  }

};
