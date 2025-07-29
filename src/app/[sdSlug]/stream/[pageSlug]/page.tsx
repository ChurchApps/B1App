import { PageLayout, Theme } from "@/components";
import { ApiHelper } from "@churchapps/apphelper";
import { ConfigHelper, EnvironmentHelper, PageInterface } from "@/helpers";

type Params = Promise<{ sdSlug: string; pageSlug: string }>;

export default async function Home({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug } = await params
  const config = await ConfigHelper.load(sdSlug, "website");
  const pageData: PageInterface = await ApiHelper.getAnonymous(`/pages/${config.church.id}/tree?url=${encodeURIComponent("/stream/")}${pageSlug}`, "ContentApi");

  return (
    <>
      <Theme config={config} />
      <PageLayout config={config} pageData={pageData} />
    </>
  );
}
