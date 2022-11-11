import { GetStaticPaths, GetStaticProps } from "next";
import { Layout } from "@/components";
import { Section } from "@/components/Section";
import { Container } from "@mui/material";
import pageData from "../../samplePages/newhere.json";
import { ApiHelper, ChurchInterface, SettingInterface } from "@/helpers";

type Props = {
  pageData: any;
  church: ChurchInterface,
  churchSettings: any
};


export default function Home(props: Props) {
  const getSections = () => {
    const result: JSX.Element[] = []
    props.pageData.sections.forEach(section => {
      result.push(<Section section={section} />)
    });
    return result;
  }

  return (
    <Layout church={props.church} churchSettings={props.churchSettings}>
      <div className="pageHeader" style={{ backgroundImage: "url('" + props.pageData.headerImage + "')" }}>
        <Container style={{ position: "relative", paddingTop: 40, paddingBottom: 40 }}>
          <h1 style={{ textAlign: "center" }}>{props.pageData.title}</h1>
        </Container>
      </div>
      {getSections()}
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


  //const pageData: PageInterface = await fetch("http://localhost:3000/samplePages/about.json").then(resp => resp.json());
  //const pageData: PageInterface = await fetch("http://localhost:3000/samplePages/newhere.json").then(resp => resp.json());

  return {
    props: { pageData, church, churchSettings },
    revalidate: 30,
  };
};
