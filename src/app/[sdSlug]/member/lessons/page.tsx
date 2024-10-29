
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { LessonsClient } from "./LessonsClient";



type Params = Promise<{ sdSlug: string;  }>;

export default async function LessonsPage({ params }: {params:Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <LessonsClient config={config} />;
}
