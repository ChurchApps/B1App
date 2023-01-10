import { GetStaticPaths, GetStaticProps } from "next";
import { Layout, PageLayout } from "@/components";
import { Section } from "@/components/Section";
import { ApiHelper, ChurchInterface, EnvironmentHelper, LinkInterface, PageInterface } from "@/helpers";

type Props = {
  pageData: any;
  church: ChurchInterface,
  churchSettings: any,
  navLinks: LinkInterface[],
  params: any
};

export default function Home(props: Props) {
  const getSections = () => {
    const result: JSX.Element[] = []
    let first = true;
    if (props.pageData?.sections) {
      for (let section of props.pageData.sections) {
        result.push(<Section section={section} first={first} churchId={props.church.id} />)
        first = false;
      }
    }
    return result;
  }

  console.log(props);
  return (
    <>
      <h1>Page Slug</h1>
      <div>
        {JSON.stringify(props)}
      </div>
      <PageLayout church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} pageData={props.pageData} />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {

  //{ params: { sdSlug: "crcc", page: "newhere" } },
  //{ params: { sdSlug: "ironwood", page: "" } },

  // leaving it empty as we don't know what routes could be.
  // as we've fallback as "blocking" it doesn't matter. The first time a route it called
  // it'll run as SSR and then cached - https://nextjs.org/docs/api-reference/data-fetching/get-static-paths#fallback-blocking
  const paths = [

  ];

  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + params.sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");

  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=" + params.pageSlug, "ContentApi");

  return {
    props: { pageData, church, churchSettings, navLinks, params },
    revalidate: 30,
  };
};
