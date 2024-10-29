import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { Wrapper } from "@/components";
import { DonateClient } from "./DonateClient";

type Params = Promise<{ sdSlug: string;  }>;

export default async function DonatePage({ params }: {params:Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <DonateClient config={config} />
    </Wrapper>
  );
}
