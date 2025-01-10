import { ConfigHelper, EnvironmentHelper, PageInterface } from "@/helpers";
import { ApiHelper } from "@churchapps/apphelper";
import { PreviewClientWrapper } from "./PreviewClientWrapper";

type Params = Promise<{ sdSlug: string;  id: string; }>

export default async function PreviewPage({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug, id}=  await params
  const config = await ConfigHelper.load(sdSlug.toString());
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + config.church.id + "/tree?id=" + id, "ContentApi");

  return <PreviewClientWrapper config={config} church={config.church} churchSettings={config.appearance} globalStyles={config.globalStyles} pageData={pageData} />;
}
