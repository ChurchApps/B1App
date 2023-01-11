import { useState, useEffect } from "react";
import Link from "next/link";
import { Grid, Typography } from "@mui/material";
import { Wrapper } from "@/components";
import { ApiHelper, GroupInterface, UserHelper } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Groups(props: any) {
  const [groups, setGroups] = useState<GroupInterface[]>([]);

  const loadData = () => {
    ApiHelper.get("/groups/my", "MembershipApi").then((data) => setGroups(data));
  };

  useEffect(loadData, []);

  if (!UserHelper.currentUserChurch?.person?.id) {
    return (
      <Wrapper sdSlug={props.sdSlug}>
        <h1>My Groups</h1>
        <h3 className="text-center w-100">
          Please <Link href="/login/?returnUrl=/directory">Login</Link> to view your groups.
        </h3>
      </Wrapper>
    );
  }

  return (
    <Wrapper sdSlug={props.sdSlug}>
      <h1>My Groups</h1>
      <Grid container spacing={3}>
        {groups?.length > 0 ? (
          groups.map((group) => (
            <Grid item md={4} xs={12}>
              <Link href={"/member/groups/" + group.id}>
                <div style={{ backgroundColor: "#000000", width: "100%", aspectRatio: "4" }}>
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        textAlign: "center",
                        position: "absolute",
                        zIndex: 9999,
                        width: "100%",
                        aspectRatio: "4",
                        paddingTop: 30,
                      }}
                    >
                      <Typography sx={{ fontSize: 34, color: "#FFFFFF" }} style={{ color: "#FFF" }}>
                        {group.name}
                      </Typography>
                    </div>
                  </div>
                  {group.photoUrl && (
                    <img
                      id="tabImage"
                      src={group.photoUrl}
                      alt="tab"
                      style={{ cursor: "pointer", opacity: 0.7, width: "100%" }}
                    />
                  )}
                </div>
              </Link>
            </Grid>
          ))
        ) : (
          <p>No groups found</p>
        )}
      </Grid>
    </Wrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return {
    props: { sdSlug: params.sdSlug },
    revalidate: 30,
  };
};
