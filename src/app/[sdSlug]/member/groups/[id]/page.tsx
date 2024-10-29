import { Wrapper } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { GroupClient } from "./GroupClient";




type Params = Promise<{ sdSlug: string; id:string }>;


export default async function GroupPage({ params }: {params:Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug, id}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <GroupClient config={config} groupId={id} />
    </Wrapper>
  );
}
