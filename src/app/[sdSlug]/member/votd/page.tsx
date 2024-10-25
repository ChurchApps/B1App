import { Wrapper } from "@/components";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { VotdClient } from "./VotdClient";

interface Props {
  params: { sdSlug: string };
}

export default async function VotdPage({ params }: Props) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <VotdClient config={config} />;
}
