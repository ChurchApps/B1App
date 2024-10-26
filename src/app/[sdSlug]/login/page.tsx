import { Login } from "@/components";
import { ConfigHelper } from "@/helpers";

type Params = Promise<{ sdSlug: string }>;


export default async function LogoutPage({ params }: { params: Params}) {
    const {sdSlug} = await params
  const config = await ConfigHelper.load(sdSlug.toString());
  return (
    <Login keyName={config.keyName} />
  );
}
