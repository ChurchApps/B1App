import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ContentEditorClient } from "./ContentEditorClient";

type Params = Promise<{ sdSlug: string;  id: string; }>


export default async function PageEditor({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug,id} = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <ContentEditorClient config={config} pageId={id} />;
}
