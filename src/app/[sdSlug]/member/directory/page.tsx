import { Wrapper } from "@/components/Wrapper";
import { ConfigHelper } from "@/helpers";
import { DirectoryClient } from "./DirectoryClient";


interface Props {
  params: { sdSlug: string };
}

export default async function DirectoryPage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <Wrapper config={config}>
      <DirectoryClient config={config} />
    </Wrapper>
  );
}
