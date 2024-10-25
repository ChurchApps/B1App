import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { PlansClient } from "./PlansClient";


interface Props {
  params: { sdSlug: string };
}

export default async function PlansPage({ params }: Props) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <PlansClient config={config} />
    </Wrapper>
  );
}
