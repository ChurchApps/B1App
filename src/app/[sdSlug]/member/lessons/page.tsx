import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { LessonsClient } from "./LessonsClient";

interface Props {
  params: { sdSlug: string };
}

export default async function LessonsPage({ params }: Props) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <LessonsClient config={config} />;
}
