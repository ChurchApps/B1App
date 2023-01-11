import { GetStaticPaths, GetStaticProps } from "next";
import { Layout, Loading } from "@/components";
import { Section } from "@/components/Section";
import pageData from "../../samplePages/newhere.json";
import { ApiHelper, ChurchInterface, EnvironmentHelper, LinkInterface } from "@/helpers";
import { useEffect } from "react";

type Props = {
  pageData: any;
  church: ChurchInterface,
  churchSettings: any,
  navLinks: LinkInterface[];
};

export default function Home(props: Props) {
  useEffect(() => {
    if (EnvironmentHelper.HideYoursite && typeof window !== undefined) window.location.href = window.location.origin + "/member";
  }, []); //eslint-disable-line

  const getSections = () => {
    const result: JSX.Element[] = []
    let first = true;
    for (let section of props.pageData.sections) {
      result.push(<Section section={section} first={first} />)
      first = false;
    }
    return result;
  }

  if (EnvironmentHelper.HideYoursite) return <Loading />
  else return (
    <Layout church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks}>
      <div id="page">
        {getSections()}
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {

  const paths = [
    { params: { sdSlug: "crcc" } },
    { params: { sdSlug: "ironwood" } },
  ];

  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + params.sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");

  //const pageData: PageInterface = await fetch("http://localhost:3000/samplePages/about.json").then(resp => resp.json());
  //const pageData: PageInterface = await fetch("http://localhost:3000/samplePages/newhere.json").then(resp => resp.json());

  return {
    props: { pageData, church, churchSettings, navLinks },
    revalidate: 30,
  };
};
