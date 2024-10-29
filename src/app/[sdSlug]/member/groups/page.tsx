import { Wrapper } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { GroupsClient } from "./GroupsClient";




type Params = Promise<{ sdSlug: string;  }>;

export default async function GroupsPage({ params }: {params:Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <GroupsClient config={config} />
    </Wrapper>
  );
}
