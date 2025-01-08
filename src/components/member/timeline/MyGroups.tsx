import { useState, useEffect } from "react";
import Link from "next/link";
import { Grid, Typography, Box } from "@mui/material";
import { ApiHelper, GroupInterface } from "@churchapps/apphelper";

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
            <Grid item xs={12}>
              <Link href={"/groups/" + group.id}>
                <Box
                  id="tabImage"
                  sx={{
                    backgroundImage: `url(${group.photoUrl})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%",
                    backgroundColor: group.photoUrl ? "#616161" : "#000000",
                    backgroundBlendMode: group.photoUrl ? "overlay" : "",
                    aspectRatio: "4",
                    width: "100%",
                    color: "white",
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Typography noWrap sx={{ fontSize: { lg: 34, md: 26, xs: 24 }, color: "#FFFFFF", padding: 2 }} style={{ color: "#FFF" }}>
                    {group.name}
                  </Typography>
                </Box>
              </Link>
            </Grid>
          ))
        )
        : (
          <p>No groups found</p>
        )}
    </Grid>
  );
}
