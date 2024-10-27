import { PageLayout, Theme } from "@/components";
import { GlobalStyleInterface, PageInterface } from "@/helpers";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper";



type Params = Promise<{ sdSlug: string; pageSlug:string}>;


export default async function Home({ params }: {params:Params}) {
    const {sdSlug, pageSlug}= await params
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=" + encodeURIComponent("/member/") + pageSlug, "ContentApi");

  return (
    <>
      <Theme appearance={churchSettings} globalStyles={globalStyles} />
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
