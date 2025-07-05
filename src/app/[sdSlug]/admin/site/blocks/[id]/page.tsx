import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { BlockEditorClient } from "./BlockEditorClient";

type Params = Promise<{ sdSlug: string;  id: string; }>

export default async function BlockEditor({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug,id } = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <BlockEditorClient config={config}  blockId={id} />;
}
