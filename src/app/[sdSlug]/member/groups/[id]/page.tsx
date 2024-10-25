import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { GroupClient } from "./GroupClient";


interface Props {
  params: { sdSlug: string; id: string };
}

export default async function GroupPage({ params }: Props) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <GroupClient config={config} groupId={params.id} />
    </Wrapper>
  );
}
