"use client";

import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import { ApiHelper, GroupInterface, Loading } from "@churchapps/apphelper";
import GroupCard from "./GroupCard";
import { EnvironmentHelper } from "@/helpers";

interface Props {
  churchId: string,
  label: string,
}

export const GroupList = (props: Props) => {
  const [groups, setGroups] = useState<GroupInterface[]>(null);
  EnvironmentHelper.init();

  useEffect(() => {
    EnvironmentHelper.init();
    ApiHelper.getAnonymous("/groups/public/" + props.churchId + "/label?label=" + encodeURIComponent(props.label), "MembershipApi").then((data) => {
      setGroups(data);
    });
  }, []);


  if (!groups) return <Loading />;
  else return (
    <Grid container spacing={3}>
      {
        groups?.length > 0
          ? (groups.map((group) => (<Grid item xs={4}><GroupCard group={group} /></Grid>)))
          : (<p>No groups found</p>)
      }
    </Grid>
  );
};
