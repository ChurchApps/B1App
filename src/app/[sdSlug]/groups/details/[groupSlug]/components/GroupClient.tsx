"use client";

import { EventInterface, GroupInterface, GroupMemberInterface, UserHelper } from "@churchapps/apphelper";
import { UnauthenticatedView } from "./UnauthenticatedView";
import { AuthenticatedView } from "./AuthenticatedView";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  config: ConfigurationInterface
  group: GroupInterface;
  events: EventInterface[];
  leaders: GroupMemberInterface[];
}

export function GroupClient(props: Props) {
  if (!UserHelper.currentUserChurch?.person?.id) return <UnauthenticatedView config={props.config} group={props.group} events={props.events} leaders={props.leaders}   />
  else return <AuthenticatedView config={props.config} group={props.group} />
}
