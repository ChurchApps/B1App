import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { GroupsClient } from "./GroupsClient";




type Params = Promise<{ sdSlug: string;  }>;

export default async function GroupsPage({ params }: {params:Params}) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <GroupsClient config={config} />
    </Wrapper>
  );
}
