import { Login } from "@/components";
import { ConfigHelper } from "@/helpers";

export default async function LogoutPage({ params }: { params: { sdSlug: string } }) {
    const {sdSlug} = await params
  const config = await ConfigHelper.load(sdSlug.toString());
  return (
    <Login keyName={config.keyName} />
  );
}
