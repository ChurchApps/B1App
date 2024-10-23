import { PageLayout, Theme } from "@/components";
import { ApiHelper, ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import { ConfigHelper, GlobalStyleInterface, PageInterface } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  params: {
    sdSlug: string;
    pageSlug: string;
  };
}

export default async function Home({ params }: Props) {
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + params.sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=" + params.pageSlug, "ContentApi");
  const config: ConfigurationInterface = await ConfigHelper.load(church.subDomain);

  return (
    <>
      <Theme appearance={churchSettings} globalStyles={globalStyles} config={config} />
      <PageLayout
        globalStyles={globalStyles}
        church={church}
        churchSettings={churchSettings}
        navLinks={navLinks}
        pageData={pageData}
      />
    </>
  );
}
