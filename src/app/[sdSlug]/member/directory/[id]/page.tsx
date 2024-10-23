import { Wrapper } from "@/components/Wrapper";
import { ConfigHelper } from "@/helpers";
import { MemberClient } from "./MemberClient";


interface Props {
  params: { sdSlug: string; id: string };
}

export default async function MemberPage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <Wrapper config={config}>
      <MemberClient config={config} personId={params.id} />
    </Wrapper>
  );
}