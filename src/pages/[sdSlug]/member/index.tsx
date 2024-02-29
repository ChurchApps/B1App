import { Wrapper } from "@/components";
import MyGroups from "@/components/member/timeline/MyGroups";
import { Timeline } from "@/components/member/timeline/Timeline";
import UserContext from "@/context/UserContext";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { ApiHelper } from "@churchapps/apphelper";
import { Grid } from "@mui/material";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { useContext } from "react";

export default function Member(props: WrapperPageProps) {
  const context = useContext(UserContext)

  if (!ApiHelper.isAuthenticated) {
    return (
      <Wrapper config={props.config}>
        <h1>Member Portal</h1>
        <p>Select an option on the left or <Link href="/login/?returnUrl=/member/groups">Login</Link>.</p>
      </Wrapper>
    );
  }

  return (
    <Wrapper config={props.config}>
      <h1>Latest Updates</h1>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <div style={{maxWidth: 750, marginLeft:"auto", marginRight:"auto"}}>
            <Timeline context={context} />
          </div>
        </Grid>
        <Grid item xs={12} md={4}>
          <MyGroups />

        </Grid>
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
