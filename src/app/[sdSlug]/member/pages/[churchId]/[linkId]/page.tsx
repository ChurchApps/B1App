import { Wrapper } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { PagesClient } from "./PagesClient";

type Params = Promise<{ sdSlug: string;  churchId: string; linkId: string; url?: string }>;

export default async function Pages({ params }: {params:Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug, churchId, linkId, url}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <PagesClient config={config} churchId={churchId} linkId={linkId}  url={url} />
    </Wrapper>
  );
}
