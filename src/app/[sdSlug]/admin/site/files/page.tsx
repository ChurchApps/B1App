
import { ConfigHelper } from "@/helpers";
import { FilesClientWrapper } from "./FilesClientWrapper";

export default async function FilesPage({ params }: { params: { sdSlug: string } }) {
    const {sdSlug} = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <FilesClientWrapper config={config} />;
}