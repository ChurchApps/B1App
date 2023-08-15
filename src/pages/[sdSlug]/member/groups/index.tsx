import { useState, useEffect } from "react";
import Link from "next/link";
import { Grid, Typography, Box } from "@mui/material";
import { Wrapper } from "@/components";
import { ApiHelper, ConfigHelper, GroupInterface, UserHelper, WrapperPageProps } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Groups(props: WrapperPageProps) {
  const [groups, setGroups] = useState<GroupInterface[]>([]);

  const loadData = () => {
    ApiHelper.get("/groups/my", "MembershipApi").then((data) => setGroups(data));
  };

  useEffect(loadData, []);

  if (!UserHelper.currentUserChurch?.person?.id) {
    return (
      <Wrapper config={props.config}>
        <h1>My Groups</h1>
        <h3 className="text-center w-100">
          Please <Link href="/login/?returnUrl=/member/groups">Login</Link> to view your groups.
        </h3>
      </Wrapper>
    );
  }

  return (
    <Wrapper config={props.config}>
      <h1>My Groups</h1>
      <Grid container spacing={3}>
        {groups?.length > 0
          ? (
            groups.map((group) => (
              <Grid item md={4} sm={6} xs={12}>
                <Link href={"/member/groups/" + group.id}>
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
    </Wrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
