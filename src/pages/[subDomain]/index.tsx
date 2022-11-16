import { GetStaticPaths, GetStaticProps } from "next";
import { Layout } from "@/components";
import { Section } from "@/components/Section";
import { Container } from "@mui/material";
import pageData from "../../samplePages/livecs.json";
import { ApiHelper, ChurchInterface, LinkInterface } from "@/helpers";

type Props = {
  pageData: any;
  church: ChurchInterface,
  churchSettings: any,
  navLinks: LinkInterface[]
};

export default function Home(props: Props) {
  const getSections = () => {
    const result: JSX.Element[] = []
    let first = true;
    for (let section of props.pageData.sections) {
      result.push(<Section section={section} first={first} />)
      first = false;
    }
    return result;
  }

  return (
    <Layout church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks}>
      <div id="page">
        {getSections()}
      </div>
    </Layout>
  );
}


export const getStaticPaths: GetStaticPaths = async () => {

  const paths = [
    { params: { subDomain: "crcc" } },
    { params: { subDomain: "ironwood" } },
  ];

  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const subDomain = params.subDomain;
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + subDomain, "AccessApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "AccessApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");

  //const pageData: PageInterface = await fetch("http://localhost:3000/samplePages/about.json").then(resp => resp.json());
  //const pageData: PageInterface = await fetch("http://localhost:3000/samplePages/newhere.json").then(resp => resp.json());

  return {
    props: { pageData, church, churchSettings, navLinks },
    revalidate: 30,
  };
};
