import { Wrapper } from "@/components/Wrapper";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { DirectoryClient } from "./DirectoryClient";




type Params = Promise<{ sdSlug: string;  }>;



export default async function DirectoryPage({ params }: {params:Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <DirectoryClient config={config} />
    </Wrapper>
  );
}
