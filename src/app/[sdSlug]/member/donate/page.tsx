import { ConfigHelper } from "@/helpers";
import { Wrapper } from "@/components";
import { DonateClient } from "./DonateClient";


interface Props {
  params: { sdSlug: string };
}

export default async function DonatePage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <Wrapper config={config}>
      <DonateClient config={config} />
    </Wrapper>
  );
}
