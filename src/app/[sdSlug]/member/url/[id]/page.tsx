import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { UrlClient } from "./UrlClient";


interface Props {
  params: { sdSlug: string; id: string };
}

export default async function UrlPage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <Wrapper config={config}>
      <UrlClient config={config} urlId={params.id} />
    </Wrapper>
  );
}
