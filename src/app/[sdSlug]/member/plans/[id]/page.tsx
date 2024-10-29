import { Wrapper } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { PlanClient } from "./PlanClient";


type Params = Promise<{ sdSlug: string; id: string }>;

export default async function PlanPage({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, id } = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <PlanClient config={config} planId={id} />
    </Wrapper>
  );
}
