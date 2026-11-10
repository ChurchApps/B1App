"use client";

import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { Loading } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";
import GroupCard from "./GroupCard";
import { EnvironmentHelper } from "@/helpers";

interface Props {
  churchId: string,
  label: string,
}

export const GroupList = (props: Props) => {
  const [groups, setGroups] = useState<GroupInterface[] | null>(null);

  useEffect(() => {
    EnvironmentHelper.init();
    const load = async (label: string) => {
      const data = await ApiHelper.getAnonymous("/groups/public/" + props.churchId + "/label?label=" + encodeURIComponent(label), "MembershipApi");
      return Array.isArray(data) ? data as GroupInterface[] : [];
    };
    // Labels are matched exactly, and churches write them both ways ("small-group" and "small group"),
    // so try the URL's label as-is and fall back to it with hyphens read as spaces.
    const spaced = props.label.replace(/-/g, " ");
    load(props.label)
      .then(async (found) => (found.length === 0 && spaced !== props.label ? load(spaced) : found))
      .then(setGroups)
      .catch(() => setGroups([]));
  }, [props.churchId, props.label]);


  if (!groups) return <Loading />;
  else {
    return (
      <Grid container spacing={3}>
        {
          groups?.length > 0
            ? (groups.map((group) => (<Grid key={group.id} size={{ xs: 12, sm: 6, md: 4 }}><GroupCard group={group} /></Grid>)))
            : (<p>{Locale.label("groups.noGroups")}</p>)
        }
      </Grid>
    );
  }
};
