import { ConfigHelper } from "@/helpers";
import { StylesClientWrapper } from "./StylesClientWrapper";

type Params = Promise<{ sdSlug: string }>;


export default async function StylesPage({ params }: { params: Params }) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <StylesClientWrapper config={config} />;
}
