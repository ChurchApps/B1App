import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { AdminClientWrapper } from "./AdminClientWrapper";


type Params = Promise<{ sdSlug: string; }>

export default async function AdminPage({ params }: { params: Params }) {
  const { sdSlug } = await params
  EnvironmentHelper.init();
  const config = await ConfigHelper.load(sdSlug.toString());

  return <AdminClientWrapper config={config} />;
}
