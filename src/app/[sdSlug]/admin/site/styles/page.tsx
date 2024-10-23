import { ConfigHelper } from "@/helpers";
import { StylesClientWrapper } from "./StylesClientWrapper";

export default async function StylesPage({ params }: { params: { sdSlug: string } }) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return <StylesClientWrapper config={config} />;
}
