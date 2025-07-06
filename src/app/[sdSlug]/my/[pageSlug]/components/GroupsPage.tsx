"use client";

import { useContext } from "react";
import UserContext from "@/context/UserContext";
import MyGroups from "@/components/member/timeline/MyGroups";

export function GroupsPage() {
  const context = useContext(UserContext);

  return (<>
    <h1>My Groups</h1>
    <MyGroups />
  </>);
}
