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
    ApiHelper.getAnonymous("/groups/public/" + props.churchId + "/label?label=" + encodeURIComponent(props.label), "MembershipApi").then((data: GroupInterface[]) => {
      setGroups(data);
    });
  }, [props.churchId, props.label]);


  if (!groups) return <Loading />;
  else {
    return (
      <Grid container spacing={3}>
        {
          groups?.length > 0
            ? (groups.map((group) => (<Grid key={group.id} size={{ xs: 4 }}><GroupCard group={group} /></Grid>)))
            : (<p>{Locale.label("groups.noGroups")}</p>)
        }
      </Grid>
    );
  }
};
