import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { FormPage } from "@/app/[sdSlug]/(public)/[pageSlug]/[id]/components/FormPage";

type PageParams = Promise<{ sdSlug: string; id: string }>;

export default async function EmbedFormPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, id } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  return <FormPage config={config} formId={id} embed />;
}
