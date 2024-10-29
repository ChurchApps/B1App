import { ConfigHelper, EnvironmentHelper, GlobalStyleInterface, PageInterface } from "@/helpers";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper";
import { PreviewClientWrapper } from "./PreviewClientWrapper";


type Params = Promise<{ sdSlug: string;  id: string; }>

export default async function PreviewPage({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug, id}=  await params
  const config = await ConfigHelper.load(sdSlug.toString());
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?id=" + id, "ContentApi");

  return <PreviewClientWrapper config={config} church={church} churchSettings={churchSettings} globalStyles={globalStyles} pageData={pageData} />;
}
