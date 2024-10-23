import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { PagesClient } from "./PagesClient";


interface Props {
    params: { sdSlug: string; churchId: string; linkId: string; url?: string };
  }

export default async function Pages({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <Wrapper config={config}>
      <PagesClient config={config} churchId={params.churchId} linkId={params.linkId}  url={params.url} />
    </Wrapper>
  );
}
