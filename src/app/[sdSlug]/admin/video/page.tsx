import { ConfigHelper } from "@/helpers";
import { ManageVideoClient } from "./ManageVideoClient";

export default async function ManageVideoPage({ params }: { params: { sdSlug: string } }) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());
  return <ManageVideoClient config={config} />;
}
