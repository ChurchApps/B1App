import { ConfigHelper } from "@/helpers";
import { Wrapper } from "@/components";
import { CheckinClient } from "./CheckinClient";



type Params = Promise<{ sdSlug: string }>;

export default async function CheckinPage({ params }: {params:Params}) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <CheckinClient config={config} />
    </Wrapper>
  );
}
