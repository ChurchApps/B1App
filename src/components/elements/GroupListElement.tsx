"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { ApiHelper, Loading } from "@churchapps/apphelper";
import GroupCard from "@churchapps/apphelper/dist/website/components/groups/GroupCard.js";
import type { GroupInterface } from "@churchapps/helpers";
import type { ElementInterface } from "@/helpers";
import { AutoScrollStrip } from "./AutoScrollStrip";

interface Props { element: ElementInterface; churchId: string; }

// Group List element: groups carrying a label, as a grid or (layout "autoscroll") one row that scrolls by itself.
export const GroupListElement = ({ element, churchId }: Props) => {
  const label = (element.answers?.label as string | undefined) || "";
  const autoScroll = element.answers?.layout === "autoscroll";
  const [groups, setGroups] = useState<GroupInterface[] | null>(null);

  useEffect(() => {
    ApiHelper.getAnonymous("/groups/public/" + churchId + "/label?label=" + encodeURIComponent(label), "MembershipApi")
      .then((data: any) => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]));
  }, [churchId, label]);

  if (!groups) return <Loading />;
  if (groups.length === 0) return <p>No groups found</p>;

  const tiles = groups.map((group) => <Box key={group.id} data-testid="group-list-tile"><GroupCard group={group} /></Box>);
  return (
    <div id={"el-" + element.id}>
      {autoScroll
        ? <AutoScrollStrip enabled={groups.length > 0} testId="group-list-strip">{tiles}</AutoScrollStrip>
        : <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}>{tiles}</Box>}
    </div>
  );
};
