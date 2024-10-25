import { ConfigHelper } from "@/helpers";
import { StylesClientWrapper } from "./StylesClientWrapper";

export default async function StylesPage({ params }: { params: { sdSlug: string } }) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <StylesClientWrapper config={config} />;
}
