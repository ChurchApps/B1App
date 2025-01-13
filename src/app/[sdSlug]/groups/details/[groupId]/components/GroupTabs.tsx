"use client";

import React from "react";

import { PersonHelper } from "@/helpers"
import UserContext from "@/context/UserContext";
import Link from "next/link";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  config: ConfigurationInterface;
}

export const GroupTabs = (props: Props) => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const tabs: any[] = []



  const getTabs = () => {
    const memberStatus = context.userChurch?.person?.membershipStatus?.toLowerCase();


    tabs.push({url:"/my/timeline", label:"Group Details"});
    tabs.push({url:"/my/timeline", label:"Calendar"});
    tabs.push({url:"/my/timeline", label:"Conversations"});
    tabs.push({url:"/my/timeline", label:"Files"});

    return tabs;
  }



  const getItem = (tab:any) =>
    //if (tab.key === selectedTab) return (<li className="active"><a href="about:blank" onClick={(e) => { e.preventDefault(); setSelectedTab(tab.key); }}><Icon>{tab.icon}</Icon> {tab.label}</a></li>)
    (<li><Link href={tab.url}>{tab.label}</Link></li>)

  return <ul>
    {getTabs().map((tab, index) => getItem(tab))}
  </ul>


};
