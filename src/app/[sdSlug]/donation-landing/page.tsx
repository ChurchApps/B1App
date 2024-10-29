
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { DonationLandingClient } from "./DonationLandingClient";

type Params = Promise<{ sdSlug: string }>;

export default async function DonationLanding({ params }: {params: Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug} = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <DonationLandingClient config={config} />;
}
