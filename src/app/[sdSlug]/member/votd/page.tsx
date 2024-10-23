import { Wrapper } from "@/components";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { VotdClient } from "./VotdClient";

interface Props {
  params: { sdSlug: string };
}

export default async function VotdPage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return <VotdClient config={config} />;
}
