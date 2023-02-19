import { GetStaticPaths, GetStaticProps } from "next";
import { Loading, PageLayout, Theme } from "@/components";
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

export default function Stream(props: Props) {
  return (<>
  <Theme appearance={props.churchSettings} />  
    <div id="streamRoot">
      <LiveStream keyName={props.church.subDomain} appearance={props.churchSettings} />
    </div>
  </>);
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