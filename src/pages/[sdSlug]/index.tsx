import { GetStaticPaths, GetStaticProps } from "next";
import { Loading, PageLayout, Theme } from "@/components";
import { ApiHelper, ChurchInterface, LinkInterface, PageInterface } from "@/helpers";
import { useEffect } from "react";

type Props = {
  pageData: any;
  church: ChurchInterface,
  churchSettings: any,
  navLinks: LinkInterface[],
};

export default function Home(props: Props) {
  useEffect(() => {
    if (!props.pageData?.url && typeof window !== undefined) window.location.href = window.location.origin + "/member";
  }, []); //eslint-disable-line

  if (!props.pageData?.url) return <Loading />
  else return (<>
    <Theme appearance={props.churchSettings} />
    <PageLayout church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} pageData={props.pageData} />
  </>);
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];

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
