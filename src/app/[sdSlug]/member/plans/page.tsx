import { Wrapper } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { PlansClient } from "./PlansClient";

type Params = Promise<{ sdSlug: string; }>;

export default async function PlansPage({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <PlansClient config={config} />
    </Wrapper>
  );
}
