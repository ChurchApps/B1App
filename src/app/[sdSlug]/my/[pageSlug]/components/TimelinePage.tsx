"use client";

import { Timeline } from "@/components/member/timeline/Timeline";
import { useContext } from "react";
import UserContext from "@/context/UserContext";

export function TimelinePage() {
  const context = useContext(UserContext);

  return (<>
    <h1>Latest Updates</h1>
    <Timeline context={context} />
  </>);
}
