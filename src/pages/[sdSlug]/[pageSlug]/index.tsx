import { GetStaticPaths, GetStaticProps } from "next";
import { Layout } from "@/components";
import { Section } from "@/components/Section";
import { ApiHelper, ChurchInterface, EnvironmentHelper, LinkInterface, PageInterface } from "@/helpers";

type Props = {
  pageData: any;
  church: ChurchInterface,
  churchSettings: any,
  navLinks: LinkInterface[],
  sdSlug: string;
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
        <b>Subdomain/Page</b><br />
        {props.sdSlug}
        {JSON.stringify(ApiHelper.apiConfigs)}
        {getSections()}
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {

  //{ params: { sdSlug: "crcc", page: "newhere" } },
  //{ params: { sdSlug: "ironwood", page: "" } },
  const paths = [

  ];

  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + params.sdSlug, "AccessApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "AccessApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");

  const pageData: PageInterface = await ApiHelper.get("/pages/" + church.id + "/tree?url=" + params.pageSlug, "ContentApi");

  return {
    props: { pageData, church, churchSettings, navLinks, sdSlug: params.sdSlug },
    revalidate: 30,
  };
};
