"use client";

import React, { useEffect, useState } from "react";

import { PersonHelper } from "@/helpers"
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { UserHelper } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";

interface Props {
  config: ConfigurationInterface;
  onTabChange: (tab: string) => void;
  group: GroupInterface;
}

export const GroupTabs = (props: Props) => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const tabs: any[] = []

  const [group, setGroup] = useState(props.group);

  useEffect(() => {
    setGroup(props.group);
  }, [props.group]);

  let isLeader = false;
  UserHelper.currentUserChurch.groups?.forEach((g) => {
    if (g.id === group?.id && g.leader) isLeader = true;
  });


  const getTabs = () => {
    const memberStatus = context.userChurch?.person?.membershipStatus?.toLowerCase();


    tabs.push({ key: "details", label: "Group Details" });
    tabs.push({ key: "members", label: "Members" });
    if (isLeader) {
      tabs.push({ key: "attendance", label: "Attendance" });
    }
    tabs.push({ key: "calendar", label: "Calendar" });
    tabs.push({ key: "conversations", label: "Conversations" });
    tabs.push({ key: "resources", label: "Resources" });
    if (isLeader) {
      tabs.push({ key: "leaderResources", label: "Resources (Leaders)" });
    }

    return tabs;
  }



  const getItem = (tab: any) =>
    //if (tab.key === selectedTab) return (<li className="active"><a href="about:blank" onClick={(e) => { e.preventDefault(); setSelectedTab(tab.key); }}><Icon>{tab.icon}</Icon> {tab.label}</a></li>)
    (<li><a href="about:blank" onClick={(e) => { e.preventDefault(); props.onTabChange(tab.key) }}>{tab.label}</a></li>)

  return <ul>
    {getTabs().map((tab, index) => getItem(tab))}
  </ul>


};
