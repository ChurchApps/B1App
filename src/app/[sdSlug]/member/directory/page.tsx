import { Wrapper } from "@/components/Wrapper";
import { ConfigHelper } from "@/helpers";
import { DirectoryClient } from "./DirectoryClient";


interface Props {
  params: { sdSlug: string };
}

export default async function DirectoryPage({ params }: Props) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <DirectoryClient config={config} />
    </Wrapper>
  );
}
