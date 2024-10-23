import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { PlansClient } from "./PlansClient";


interface Props {
  params: { sdSlug: string };
}

export default async function PlansPage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <Wrapper config={config}>
      <PlansClient config={config} />
    </Wrapper>
  );
}
