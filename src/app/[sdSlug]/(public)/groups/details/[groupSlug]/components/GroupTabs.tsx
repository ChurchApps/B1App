"use client";

import React, { useEffect, useState } from "react";

import { PersonHelper } from "@/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { UserHelper, Locale } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";
import { Permissions } from "@churchapps/helpers";

interface TabItem {
  key: string;
  label: string;
}

interface Props {
  config: ConfigurationInterface;
  onTabChange: (tab: string) => void;
  group: GroupInterface;
}

export const GroupTabs = (props: Props) => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const tabs: TabItem[] = [];

  const [group, setGroup] = useState(props.group);

  useEffect(() => {
    setGroup(props.group);
  }, [props.group]);

  let isLeader = false;
  UserHelper.currentUserChurch.groups?.forEach((g) => {
    if (g.id === group?.id && g.leader) isLeader = true;
  });

  const canEditGroup = isLeader || UserHelper.checkAccess(Permissions.membershipApi.groups.edit);
  const canViewLeaderResources = isLeader || UserHelper.checkAccess(Permissions.membershipApi.groups.edit);


  const getTabs = () => {
    const memberStatus = context.userChurch?.person?.membershipStatus?.toLowerCase();


    tabs.push({ key: "details", label: Locale.label("groupsPage.groupDetails") });
    tabs.push({ key: "members", label: Locale.label("groupsPage.members") });
    if (canEditGroup) {
      tabs.push({ key: "attendance", label: Locale.label("groupsPage.attendance") });
    }
    tabs.push({ key: "calendar", label: Locale.label("groupsPage.calendar") });
    tabs.push({ key: "conversations", label: Locale.label("groupsPage.conversations") });
    tabs.push({ key: "resources", label: Locale.label("groupsPage.resources") });
    if (canViewLeaderResources) {
      tabs.push({ key: "leaderResources", label: Locale.label("groupsPage.resourcesLeaders") });
    }

    return tabs;
  };



  const getItem = (tab: TabItem) =>
    (<li key={tab.key}><a href="about:blank" data-testid={`group-tab-${tab.key}-link`} onClick={(e) => { e.preventDefault(); props.onTabChange(tab.key); }}>{tab.label}</a></li>);

  return <ul>
    {getTabs().map((tab, index) => getItem(tab))}
  </ul>;


};
