import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { PlanClient } from "./PlanClient";


interface Props {
  params: { sdSlug: string; id: string };
}

export default async function PlanPage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <Wrapper config={config}>
      <PlanClient config={config} planId={params.id} />
    </Wrapper>
  );
}
