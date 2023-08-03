import { Wrapper } from "@/components";
import { Timeline } from "@/components/member/timeline/Timeline";
import UserContext from "@/context/UserContext";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { Grid } from "@mui/material";
import { GetStaticPaths, GetStaticProps } from "next";
import { useContext } from "react";

export default function Member(props: WrapperPageProps) {
  const context = useContext(UserContext)

  return (
    <Wrapper config={props.config}>
      <h1>Member Portal</h1>
      <p>Select and option on the left</p>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Timeline context={context} />
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
