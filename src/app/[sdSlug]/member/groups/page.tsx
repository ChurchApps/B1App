import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { GroupsClient } from "./GroupsClient";


interface Props {
  params: { sdSlug: string };
}

export default async function GroupsPage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <Wrapper config={config}>
      <GroupsClient config={config} />
    </Wrapper>
  );
}
