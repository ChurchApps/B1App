"use server";

import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ManageVideoClient } from "./ManageVideoClient";


type Params = Promise<{ sdSlug: string }>;


export default async function ManageVideoPage({ params }: { params: Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug}= await params

  const config = await ConfigHelper.load(sdSlug.toString());
  return <ManageVideoClient config={config} />;
}
