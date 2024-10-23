
import { ConfigHelper } from "@/helpers";
import { DonationLandingClient } from "./DonationLandingClient";

interface Props {
  params: { sdSlug: string };
}

export default async function DonationLanding({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return <DonationLandingClient config={config} />;
}
