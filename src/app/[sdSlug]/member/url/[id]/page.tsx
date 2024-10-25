import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { UrlClient } from "./UrlClient";


interface Props {
  params: { sdSlug: string; id: string };
}

export default async function UrlPage({ params }: Props) {
    const {sdSlug,id}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <UrlClient config={config} urlId={id} />
    </Wrapper>
  );
}
