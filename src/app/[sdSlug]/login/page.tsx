import { Login } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";

type Params = Promise<{ sdSlug: string }>;


export default async function LogoutPage({ params }: { params: Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug} = await params
  const config = await ConfigHelper.load(sdSlug.toString());
  return (
    <Login keyName={config.keyName} />
  );
}
