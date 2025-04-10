import { useState, useEffect } from "react";
import { Grid } from "@mui/material";
import { ApiHelper, GroupInterface } from "@churchapps/apphelper";
import GroupCard from "@/components/groups/GroupCard";

export default function MyGroups() {
  const [groups, setGroups] = useState<GroupInterface[]>([]);

  const loadData = () => {
    ApiHelper.get("/groups/my", "MembershipApi").then((data) => setGroups(data));
  };

  useEffect(loadData, []);

  return (
    <Grid container spacing={3}>
      {groups?.length > 0
        ? (
          groups.map((group) => (
            <Grid item xs={12} sm={6} md={4}>
              <GroupCard group={group} />
            </Grid>
          ))
        )
        : (
          <p>No groups found</p>
        )}
    </Grid>
  );
}
