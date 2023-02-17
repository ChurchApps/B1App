import { GetStaticPaths, GetStaticProps } from "next";
import { Loading, PageLayout } from "@/components";
import { ApiHelper, ChurchInterface, EnvironmentHelper, LinkInterface, PageInterface } from "@/helpers";
import { useEffect } from "react";
import { Box } from "@mui/material";
import { LiveStream } from "@/components/video/LiveStream";

type Props = {
  pageData: any;
  church: ChurchInterface,
  churchSettings: any,
  navLinks: LinkInterface[],
};

export default function Home(props: Props) {
  return (<Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }} >
    <Box sx={{ maxWidth: "930px", margin: "auto", paddingY: "72px" }}>
      <h1>Hi</h1>
      <LiveStream keyName={props.church.subDomain} />
    </Box>
  </Box>);
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];

  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {

  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + params.sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");

  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=/", "ContentApi");

  return {
    props: { pageData, church, churchSettings, navLinks },
    revalidate: 30,
  };
};