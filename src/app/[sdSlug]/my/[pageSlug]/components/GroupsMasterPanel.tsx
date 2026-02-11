"use client";

import React from "react";
import Link from "next/link";
import { ApiHelper } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";
import { Icon } from "@mui/material";

export function GroupsMasterPanel() {
  const [groups, setGroups] = React.useState<GroupInterface[]>([]);

  React.useEffect(() => {
    ApiHelper.get("/groups/my", "MembershipApi").then((data: GroupInterface[]) => setGroups(data));
  }, []);

  return (
    <>
      <div className="masterHeader">
        <h2>
          <Icon sx={{ color: "#1565C0" }}>groups</Icon>
          My Groups
        </h2>
      </div>
      <div className="masterList">
        {groups.length === 0 && <div style={{ padding: 20, color: "#666" }}>No groups found.</div>}
        {groups.map((group) => (
          <Link key={group.id} href={"/groups/details/" + group.slug} className="groupItem" data-testid={`group-item-${group.slug}`}>
            <img
              className="groupThumb"
              src={group.photoUrl || "/images/group.jpg"}
              alt={group.name}
            />
            <div className="groupInfo">
              <div className="groupName">{group.name}</div>
              {(group.meetingTime || group.meetingLocation) && (
                <div className="groupSub">
                  {[group.meetingTime, group.meetingLocation].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            <Icon className="groupChevron">chevron_right</Icon>
          </Link>
        ))}
      </div>
    </>
  );
}
