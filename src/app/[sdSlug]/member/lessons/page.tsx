import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { LessonsClient } from "./LessonsClient";

interface Props {
  params: { sdSlug: string };
}

export default async function LessonsPage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return <LessonsClient config={config} />;
}
