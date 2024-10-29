import { Wrapper } from "@/components/Wrapper";
import { ConfigHelper } from "@/helpers";
import { MemberClient } from "./MemberClient";




type Params = Promise<{ sdSlug: string; id:string }>;


export default async function MemberPage({ params }: {params:Params}) {
    const {sdSlug,id}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <MemberClient config={config} personId={id} />
    </Wrapper>
  );
}