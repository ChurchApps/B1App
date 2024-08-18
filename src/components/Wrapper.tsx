import React, { useEffect } from "react";
import UserContext from "../context/UserContext";
import { Box, CssBaseline, Divider, List, ThemeProvider } from "@mui/material";
import { useRouter } from "next/router"
import { Themes, SiteWrapper, NavItem, UserHelper, Permissions, ApiHelper } from "@churchapps/apphelper";
import { PersonHelper } from "@/helpers"
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props { config: ConfigurationInterface, pageTitle?: string, children: React.ReactNode }

export const Wrapper: React.FC<Props> = props => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const tabs:any = []
  const router = useRouter();
  const [classRoooms, setClassrooms] = React.useState([]);
  const [campuses, setCampuses] = React.useState([]);

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
    else if (path.startsWith("/member/plans")) result = "plans";
    else if (path.startsWith("/member/votd")) result = "votd";
    else if (path.startsWith("/member/groups")) result = "groups";
    else if (path.match("/member")) result = "member";
    return result;
  }


  const loadData = () => {
    if (UserHelper.currentUserChurch) {
      ApiHelper.get("/classrooms/person", "LessonsApi").then(data => setClassrooms(data));
      ApiHelper.get("/campuses", "AttendanceApi").then(data => setCampuses(data));
    }
  }

  const getTabs = () => {
    props.config.tabs?.forEach(tab => {
      switch (tab.linkType) {
        case "stream":
          tabs.push(<NavItem key="/member/stream" url="/member/stream" label={tab.text} icon={tab.icon} router={router} selected={selectedTab === "stream"} />)
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
        default:
          break
      }
    })
  }

  //
  //tabs.push(<NavItem key="/member" url="/member" label="Member" icon="person" router={router} selected={selectedTab === "member"} />)

  const getSpecialTabs = () => {
    tabs.push(<Divider />)

    const memberStatus = context.userChurch?.person?.membershipStatus?.toLowerCase();

    let showWebsite = props.config.hasWebsite,
      showDonations = props.config.allowDonations,
      showMyGroups = false, showPlans = false,
      showDirectory = memberStatus === "member" || memberStatus==="staff",
      showLessons = classRoooms.length>0,
      showCheckin = campuses.length>0,
      showChums = UserHelper.checkAccess(Permissions.membershipApi.people.edit),
      showAdmin = UserHelper.checkAccess(Permissions.contentApi.content.edit);

    if (context.userChurch)
    {
      showMyGroups = context.userChurch?.groups?.length > 0;
      context.userChurch.groups.forEach(group => {
        if (group.tags.indexOf("team")>-1) showPlans = true;
      });
    }

    if (showWebsite) tabs.push(<NavItem key="/" url="/" label="Website" icon="home" router={router} />);
    if (showMyGroups) tabs.push(<NavItem key="/member" url="/member" label="My Groups" icon="group" router={router} selected={selectedTab === "groups"} />);
    if (showCheckin) tabs.push(<NavItem key="/member/checkin" url="/member/checkin" label="Check In" icon="check_box" router={router} selected={selectedTab === "checkin"} />)
    if (showDonations) tabs.push(<NavItem key="/member/donate" url="/member/donate" label="Donate" icon="volunteer_activism" router={router} selected={selectedTab === "donation"} />)
    if (showDirectory) tabs.push(<NavItem key="/member/directory" url="/member/directory" label="Member Directory" icon="groups" router={router} selected={selectedTab === "directory"} />);
    if (showPlans) tabs.push(<NavItem key="/member/plans" url="/member/plans" label="Plans" icon="event" router={router} selected={selectedTab === "plans"} />);
    if (showLessons) tabs.push(<NavItem key="/member/lessons" url="/member/lessons" label="Lessons" icon="school" router={router} selected={selectedTab === "lessons"} />)
    if (showChums) tabs.push(<NavItem key="/chums" url="/member/url/chums" label="Chums" icon="account_circle" router={router} />);
    if (showAdmin) tabs.push(<NavItem key="/admin" url="/admin" label="Admin" icon="settings" router={router} />);
  }

  useEffect(() => { loadData() }, [context.userChurch])

  const selectedTab = getSelectedTab();
  getTabs();
  getSpecialTabs();




  const navContent = <><List component="nav" sx={Themes.NavBarStyle}>{tabs}</List></>


  return <ThemeProvider theme={Themes.BaseTheme}>
    <CssBaseline />
    <Box sx={{ display: "flex", backgroundColor: "#EEE" }}>
      <SiteWrapper navContent={navContent} context={context} appName="B1" router={router} appearance={props.config.appearance}>{props.children}</SiteWrapper>
    </Box>
  </ThemeProvider>


};
