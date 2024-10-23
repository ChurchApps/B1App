import { ConfigHelper } from "@/helpers";
import { MemberClientWrapper } from "./MemberClientWrapper";

export default async function MemberPage({ params }: { params: { sdSlug: string } }) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <MemberClientWrapper config={config} />
  );
}

