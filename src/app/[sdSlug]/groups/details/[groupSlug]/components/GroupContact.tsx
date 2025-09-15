"use client";

import React from "react";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import type { GroupInterface, GroupMemberInterface } from "@churchapps/helpers";
import { GroupContact as SharedGroupContact } from "@/components/groups/GroupContact";

interface Props {
    leaders: GroupMemberInterface[];
    group: GroupInterface;
    config: ConfigurationInterface;
}

export function GroupContact(props: Props) {
  return (
    <SharedGroupContact
      leaders={props.leaders}
      group={props.group}
      config={props.config}
    />
  );
}
