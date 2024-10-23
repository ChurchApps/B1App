import { ConfigHelper, GlobalStyleInterface, PageInterface } from "@/helpers";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper";
import { PreviewClientWrapper } from "./PreviewClientWrapper";

export default async function PreviewPage({ params }: { params: { sdSlug: string; id: string } }) {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + params.sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?id=" + params.id, "ContentApi");

  return <PreviewClientWrapper config={config} church={church} churchSettings={churchSettings} globalStyles={globalStyles} pageData={pageData} />;
}
