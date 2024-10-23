import { Login } from "@/components";
import { ConfigHelper } from "@/helpers";

export default async function LogoutPage({ params }: { params: { sdSlug: string } }) {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return (
    <Login keyName={config.keyName} />
  );
}
