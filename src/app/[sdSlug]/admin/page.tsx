import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { AdminClientWrapper } from "./AdminClientWrapper";

export default async function AdminPage({ params }: { params: { sdSlug: string } }) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <AdminClientWrapper config={config} />
  );
}
