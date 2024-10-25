import { ConfigHelper } from "@/helpers";
import { Wrapper } from "@/components";
import { CheckinClient } from "./CheckinClient";


interface Props {
  params: { sdSlug: string };
}

export default async function CheckinPage({ params }: Props) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <CheckinClient config={config} />
    </Wrapper>
  );
}
