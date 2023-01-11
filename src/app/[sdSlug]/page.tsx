//import { Section } from "@/components/Section";
import { ApiConfig, ApiHelper, ApiListType, ChurchInterface, EnvironmentHelper, LinkInterface, PageInterface } from "@/helpers";

type Props = {
  params: {
    sdSlug: string
  }
};

export default async function Home(props: Props) {

  console.log(ApiHelper.apiConfigs)
  //const church = ApiHelper.getAnonymous("/churches/lookup?subDomain=" + props.params.sdSlug, "MembershipApi");
  //const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + props.params.sdSlug, "MembershipApi");
  //const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  //const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
  //const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=" + "/about", "ContentApi");

  return <>Hello</>
  /*
    const getSections = () => {
      const result: JSX.Element[] = []
      let first = true;
      for (let section of pageData.sections) {
        result.push(<Section section={section} first={first} />)
        first = false;
      }
      return result;
    }
  
  
    if (EnvironmentHelper.HideYoursite) return <Loading />
    else return (
      <Layout church={church} churchSettings={churchSettings} navLinks={navLinks}>
        <div id="page">
          {getSections()}
        </div>
      </Layout>
    );
    */
}
