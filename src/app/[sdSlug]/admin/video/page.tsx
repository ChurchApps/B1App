import { ConfigHelper } from "@/helpers";
import { ManageVideoClient } from "./ManageVideoClient";

export default async function ManageVideoPage({ params }: { params: { sdSlug: string } }) {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return <ManageVideoClient config={config} />;
}
