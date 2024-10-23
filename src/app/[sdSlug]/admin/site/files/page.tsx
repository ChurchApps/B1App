
import { ConfigHelper } from "@/helpers";
import { FilesClientWrapper } from "./FilesClientWrapper";

export default async function FilesPage({ params }: { params: { sdSlug: string } }) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return <FilesClientWrapper config={config} />;
}