import { PageLayout, Theme } from "@/components";
import { ApiHelper, ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import { GlobalStyleInterface, PageInterface } from "@/helpers";

interface Props {
  params: { sdSlug: string; pageSlug: string };
}

export default async function Home({ params }: Props) {
  const church: ChurchInterface = await ApiHelper.getAnonymous(`/churches/lookup?subDomain=${params.sdSlug}`, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous(`/settings/public/${church.id}`, "MembershipApi");
  const navLinks: LinkInterface[] = await ApiHelper.getAnonymous(`/links/church/${church.id}?category=website`, "ContentApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous(`/globalStyles/church/${church.id}`, "ContentApi");
  const pageData: PageInterface = await ApiHelper.getAnonymous(`/pages/${church.id}/tree?url=${encodeURIComponent("/stream/")}${params.pageSlug}`, "ContentApi");

  return (
    <>
      <Theme appearance={churchSettings} globalStyles={{}} />
      <PageLayout globalStyles={globalStyles} church={church} churchSettings={churchSettings} navLinks={navLinks} pageData={pageData} />
    </>
  );
}
