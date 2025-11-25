"use client";

import React, { useEffect } from "react";

import { UserHelper } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import { PersonHelper } from "@/helpers"
import UserContext from "@/context/UserContext";
import Link from "next/link";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface TabItem {
  url: string;
  label: string;
}

interface Classroom {
  id: string;
  name: string;
}

interface Campus {
  id: string;
  name: string;
}

interface Props {
  config: ConfigurationInterface;
}

export const TabsClient = (props: Props) => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const tabs: TabItem[] = []
  const [classRoooms, setClassrooms] = React.useState<Classroom[]>([]);
  const [campuses, setCampuses] = React.useState<Campus[]>([]);

  const loadData = () => {
    if (UserHelper.currentUserChurch) {
      ApiHelper.get("/classrooms/person", "LessonsApi").then((data: Classroom[]) => setClassrooms(data));
      ApiHelper.get("/campuses", "AttendanceApi").then((data: Campus[]) => setCampuses(data));
    }
  }


  const getTabs = () => {
    const memberStatus = context.userChurch?.person?.membershipStatus?.toLowerCase();

    let showMyGroups = false,
      showDonations = props.config.allowDonations,
      showPlans = false,
      showDirectory = memberStatus === "member" || memberStatus === "staff",
      showLessons = classRoooms.length > 0,
      showCheckin = campuses.length > 0,
      showAdmin = UserHelper.checkAccess(Permissions.membershipApi.people.view);

    if (context.userChurch) {
      showMyGroups = context.userChurch?.groups?.length > 0;
      context.userChurch.groups.forEach((group: { tags: string }) => {
        if (group.tags.indexOf("team") > -1) showPlans = true;
      });
    }

    tabs.push({url:"/my/timeline", label:"Timeline"});
    if (showMyGroups) tabs.push({url:"/my/groups", label:"Groups"});
    if (showDirectory) tabs.push({url:"/my/community", label:"Community"});
    if (showPlans) tabs.push({url:"/my/plans", label:"Plans"});
    if (showCheckin) tabs.push({url:"/my/checkin", label:"Check-in"});
    if (showLessons) tabs.push({url:"/my/lessons", label:"Lessons"});
    if (showDonations) tabs.push({url:"/my/donate", label:"Donations"});
    if (showAdmin) tabs.push({url:`https://admin.b1.church/login?jwt=${context.userChurch.jwt}&churchId=${context.userChurch.church.id}&returnUrl=/`, label:"Admin"});
    return tabs;
  }

  useEffect(() => { loadData() }, [context.userChurch])


  const getItem = (tab: TabItem) => (<li key={tab.url}><Link href={tab.url} data-testid={`my-tab-${tab.label.toLowerCase()}`} aria-label={`Go to ${tab.label}`}>{tab.label}</Link></li>)

  return <ul data-testid="my-portal-tabs" aria-label="Member portal navigation">
    {getTabs().map((tab, index) => getItem(tab))}
  </ul>


};
