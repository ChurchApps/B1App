import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { PagesClient } from "./PagesClient";

type Params = Promise<{ sdSlug: string; churchId: string; linkId: string }>;
type SearchParams = Promise<{ url: string }>;

export default async function Pages({ params, searchParams }: { params: Params, searchParams: SearchParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, churchId, linkId } = await params;
  const { url } = await searchParams;
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <PagesClient config={config} churchId={churchId} linkId={linkId} url={url} />
  );
}
