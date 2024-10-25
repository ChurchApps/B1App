import { ConfigHelper, GlobalStyleInterface } from "@/helpers";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper";
import { ContentEditorClient } from "./ContentEditorClient";

export default async function PageEditor({ params }: { params: { sdSlug: string; id: string } }) {
    const {sdSlug} = await params
  const config = await ConfigHelper.load(sdSlug.toString());
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");

  return <ContentEditorClient config={config} church={church} churchSettings={churchSettings} globalStyles={globalStyles} pageId={params.id} />;
}
