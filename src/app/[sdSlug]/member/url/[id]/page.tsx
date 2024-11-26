import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { UrlClient } from "./UrlClient";

type Params = Promise<{ sdSlug: string; id: string  }>;

export default async function UrlPage({ params }: {params:Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug,id}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (

    <UrlClient config={config} urlId={id} />

  );
}
