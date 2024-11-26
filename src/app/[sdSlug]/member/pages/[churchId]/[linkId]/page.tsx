import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { PagesClient } from "./PagesClient";

type Params = Promise<{ sdSlug: string;  churchId: string; linkId: string; url?: string }>;

export default async function Pages({ params, searchParams }: {params:Params, searchParams: {url:string}}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug, churchId, linkId}= await params
  const {url} = searchParams;
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <PagesClient config={config} churchId={churchId} linkId={linkId} url={url} />
  );
}
