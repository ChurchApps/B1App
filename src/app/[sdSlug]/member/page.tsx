import { ConfigHelper } from "@/helpers";
import { MemberClientWrapper } from "./MemberClientWrapper";



type Params = Promise<{ sdSlug: string;  }>;

export default async function MemberPage({ params }: { params: Params }) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <MemberClientWrapper config={config} />
  );
}

