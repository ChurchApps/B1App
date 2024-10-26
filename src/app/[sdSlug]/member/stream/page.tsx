import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { EnvironmentHelper } from "@/helpers";


type Params = Promise<{ sdSlug: string; }>;


export default async function StreamPage({ params }: {params:Params}) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <iframe
        title="content"
        className="full-frame"
        src={EnvironmentHelper.Common.B1Root.replace("{key}", config.church.subDomain) + "/stream?hideHeader=1"}
      />
    </Wrapper>
  );
}
