"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Grid, Typography, Box } from "@mui/material";
import { WrapperPageProps } from "@/helpers";
import { ApiHelper, GroupInterface, UserHelper } from "@churchapps/apphelper";

export function GroupsClient(props: WrapperPageProps) {
  const [groups, setGroups] = useState<GroupInterface[]>([]);

  const loadData = () => {
    ApiHelper.get("/groups/my", "MembershipApi").then((data) => setGroups(data));
  };

  useEffect(loadData, []);

  if (!UserHelper.currentUserChurch?.person?.id) {
    return (
      <>
        <h1>My Groups</h1>
        <h3 className="text-center w-100">
          Please <Link href="/login/?returnUrl=/member/groups">Login</Link> to view your groups.
        </h3>
      </>
    );
  }

  return (
    <>
      <h1>My Groups</h1>
      <Grid container spacing={3}>
        {groups?.length > 0
          ? (
            groups.map((group) => (
              <Grid item md={4} sm={6} xs={12} key={group.id}>
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
                    <Typography
                      noWrap
                      sx={{ fontSize: { lg: 34, md: 26, xs: 24 }, color: "#FFFFFF", padding: 2 }}
                      style={{ color: "#FFF" }}
                    >
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
    </>
  );
}
