"use client";

import React from "react";

import { PersonHelper } from "@/helpers"
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  config: ConfigurationInterface;
  onTabChange: (tab:string) => void;
}

export const GroupTabs = (props: Props) => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const tabs: any[] = []



  const getTabs = () => {
    const memberStatus = context.userChurch?.person?.membershipStatus?.toLowerCase();


    tabs.push({key:"details", label:"Group Details"});
    tabs.push({key:"members", label:"Members"});
    tabs.push({key:"calendar", label:"Calendar"});
    tabs.push({key:"conversations", label:"Conversations"});
    tabs.push({key:"files", label:"Files"});

    return tabs;
  }



  const getItem = (tab:any) =>
    //if (tab.key === selectedTab) return (<li className="active"><a href="about:blank" onClick={(e) => { e.preventDefault(); setSelectedTab(tab.key); }}><Icon>{tab.icon}</Icon> {tab.label}</a></li>)
    (<li><a href="about:blank" onClick={(e) => {e.preventDefault(); props.onTabChange(tab.key)}}>{tab.label}</a></li>)

  return <ul>
    {getTabs().map((tab, index) => getItem(tab))}
  </ul>


};
