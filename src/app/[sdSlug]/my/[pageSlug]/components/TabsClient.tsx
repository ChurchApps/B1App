"use client";

import React, { useEffect } from "react";

import { UserHelper, ApiHelper } from "@churchapps/apphelper";
import { PersonHelper } from "@/helpers"
import UserContext from "@/context/UserContext";
import Link from "next/link";


export const TabsClient = () => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const tabs: any[] = []
  const [classRoooms, setClassrooms] = React.useState([]);
  const [campuses, setCampuses] = React.useState([]);

  const loadData = () => {
    if (UserHelper.currentUserChurch) {
      ApiHelper.get("/classrooms/person", "LessonsApi").then(data => setClassrooms(data));
      ApiHelper.get("/campuses", "AttendanceApi").then(data => setCampuses(data));
    }
  }


  const getTabs = () => {
    const memberStatus = context.userChurch?.person?.membershipStatus?.toLowerCase();

    let showMyGroups = false,
      showPlans = false,
      showDirectory = memberStatus === "member" || memberStatus === "staff",
      showLessons = classRoooms.length > 0,
      showCheckin = campuses.length > 0;

    if (context.userChurch) {
      showMyGroups = context.userChurch?.groups?.length > 0;
      context.userChurch.groups.forEach(group => {
        if (group.tags.indexOf("team") > -1) showPlans = true;
      });
    }

    tabs.push({url:"/my/timeline", label:"Timeline"});
    if (showMyGroups) tabs.push({url:"/my/groups", label:"Groups"});
    if (showDirectory) tabs.push({url:"/my/community", label:"Community"});
    if (showPlans) tabs.push({url:"/my/plans", label:"Plans"});
    if (showCheckin) tabs.push({url:"/my/checkin", label:"Check-in"});
    if (showLessons) tabs.push({url:"/my/lessons", label:"Lessons"});
    return tabs;
  }

  useEffect(() => { loadData() }, [context.userChurch])


  const getItem = (tab:any) =>
    //if (tab.key === selectedTab) return (<li className="active"><a href="about:blank" onClick={(e) => { e.preventDefault(); setSelectedTab(tab.key); }}><Icon>{tab.icon}</Icon> {tab.label}</a></li>)
    (<li><Link href={tab.url}>{tab.label}</Link></li>)

  return <ul>
    {getTabs().map((tab, index) => getItem(tab))}
  </ul>


};
