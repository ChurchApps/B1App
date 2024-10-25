import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { GroupsClient } from "./GroupsClient";


interface Props {
  params: { sdSlug: string };
}

export default async function GroupsPage({ params }: Props) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <GroupsClient config={config} />
    </Wrapper>
  );
}
