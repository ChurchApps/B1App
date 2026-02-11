"use client";

import { UserHelper } from "@churchapps/apphelper";
import type { EventInterface, GroupInterface, GroupMemberInterface } from "@churchapps/helpers";
import { UnauthenticatedView } from "./UnauthenticatedView";
import { AuthenticatedView } from "./AuthenticatedView";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  config: ConfigurationInterface
  group: GroupInterface | null;
  events: EventInterface[];
  leaders: GroupMemberInterface[];
}

export function GroupClient(props: Props) {
  // Handle case where group doesn't exist
  if (!props.group) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Group Not Found</h1>
        <p>The group you're looking for could not be found.</p>
      </div>
    );
  }

  if (!UserHelper.currentUserChurch?.person?.id) return <UnauthenticatedView config={props.config} group={props.group} events={props.events} leaders={props.leaders} />;
  else return <AuthenticatedView config={props.config} group={props.group} />;
}
