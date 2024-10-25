import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { AdminClientWrapper } from "./AdminClientWrapper";

export default async function AdminPage({ params }: { params: { sdSlug: string } }) {
    const {sdSlug} = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <AdminClientWrapper config={config} />
  );
}
