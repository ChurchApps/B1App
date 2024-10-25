import { ConfigHelper } from "@/helpers";
import { MemberClientWrapper } from "./MemberClientWrapper";

export default async function MemberPage({ params }: { params: { sdSlug: string } }) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <MemberClientWrapper config={config} />
  );
}

